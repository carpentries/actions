const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  // This should be a token with access to your repository scoped in as a secret.
  // The YML workflow will need to set myToken with the GitHub Secret Token
  // myToken: ${{ secrets.GITHUB_TOKEN }}
  // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
  const myToken    = core.getInput('token');
  const octokit    = github.getOctokit(myToken);

  const PR         = core.getInput('pr');
  const sha        = core.getInput('sha');
  const headroom   = Number(core.getInput('headroom'));
  const repository = core.getInput('repo').split('/');
  const bad_origin = core.getInput('invalid');
  const fail_on_error = (core.getInput('fail_on_error') === "true");

  let valid = true; // true if valid and no workflow files are modified
  let pass  = true; // true if modified files are only content OR workflows, but otherwise valid
  let MSG = "";  // MSG output

  function getFilename(f) {
    return f.filename;
  }
  
  function getSHA(c) {
    return c.node.commit.oid;
  }

  function isNotWorkflow(l) {
    return !l.startsWith('.github/');
  }

  // STEP 1: Access Pull Request -----------------------------------------------
  const pullRequest = await octokit.pulls.get({
    owner: repository[0],
    repo: repository[1],
    pull_number: Number(PR),
  }).catch(err => { 
    // HTTP errors turn into a failed run
    console.log(err);
    core.setFailed(`There was a problem with the request (Status ${err.status}). See log.`);
    process.exit(1);
  });

  let that_repo = pullRequest.data.head.repo;

  // STEP 2: Perform Checks ----------------------------------------------------
  // --- CHECK: pull request is still open 
  console.log(`checking if PR #${PR} was previously merged`);
  valid = pullRequest.data.state == 'open';
  if (!valid) {
    MSG = `${MSG} **NOTE:** This Pull Request (#${PR}) was previously merged`;
    console.log(MSG);
  }

  // --- CHECK: pull request is IDENTICAL to the provided sha
  if (sha) {
    console.log(`checking if ${sha} is HEAD commit`);
    let sha_valid = pullRequest.data.head.sha == sha;
    // Here, we want to check if the commits that we are testing is in the last
    // number of commits as indicated by 'headroom'. 
    //
    // Right now, my strategy is not working. because the request I am using
    // returns the number of commits starting with the oldest commit. 
    if (!sha_valid && headroom > 1) {
      console.log(`checking if ${sha} is within last ${headroom} commits`);
      const commits = await octokit.graphql(
        `
        query lastCommits($owner: String!, $repo: String!, $pull_number: Int = 1, $n: Int = 1) {
          repository(owner: $owner, name: $repo) {
            pullRequest(number: $pull_number) {
              commits(last: $n) {
                edges {
                  node {
                    commit {
                      oid
                    }
                  }
                }
              }
            }
          }
        }
        `,
        {
          owner: repository[0],
          repo: repository[1],
          pull_number: Number(PR),
          n: headroom
        }
      ).catch(err => {
        // HTTP errors turn into a failed run
        console.log(err);
        core.setFailed(`There was a problem with the request (Status ${err.status}). See log.`);
        process.exit(1);
      });
      // the commit is valid if sha is included within the last n commits
      sha_valid = commits.repository.pullRequest.commits.edges.map(getSHA).includes(sha);
    }
    valid = valid && sha_valid
    pass = valid;
    if (!sha_valid) {
      MSG = `${MSG}
## :x: DANGER :x: 

**Do not merge this Pull Request**. This PR has been spoofed to look like #${PR} (HEAD @ ${pullRequest.data.head.sha}).`;
      core.setOutput("VALID", valid);
      core.setOutput("MSG", MSG);
      if (fail_on_error) {
        core.setFailed(MSG);
        process.exit(1);
      } else {
        console.log(MSG);
      }
    }
  }
  // If it is invalid at this point, it is spoofed, and we can skip the checks
  if (valid) {
    // create payload output if the PR is not spoofed
    core.setOutput("payload", JSON.stringify(pullRequest));
    // --- CHECK: The bad commit does not exist
    //     BUT, if we are in a branch in our own repo, then we can allow it
    //     because GitHub keeps track of old refs, even if they have been
    //     deleted. 
    if (bad_origin != '') {
      console.log(`checking for the invalid commit ${bad_origin}`);
      // https://stackoverflow.com/a/23970412/2752888
      //
      // Use a strategy of checking the comparison between the branch and the
      // bad commit. If the hisotry is divergent, then it is safe to assume that
      // it does not exist on the branch.
      let bad_origin_request = `GET /repos/{owner}/{repo}/compare/{branch}...${bad_origin}`
      // This will return a null if there is no comparison and it will reterun
      // "diverged" if the commit is in the history. 
      const { data: comparison } = await octokit.request(bad_origin_request, {
        owner: that_repo.owner.login,
        repo: that_repo.name,
        branch: pullRequest.data.head.ref,
      }).catch(err => { 
        if (err.status == '404') {
          // status 404 means that we did not see a commit so we can move on.
          return({data: null});
        } else {
          console.log(err);
          core.setFailed(`Failed to request commit comparison (Status ${err.status}). See log.`);
          process.exit(1);
        }
      });

      // If we get the bad commit back, then the PR should be closed and the 
      // author should be encouraged to remove their repository 
      let origin_valid = !comparison || !comparison.status || comparison.status == "diverged";
      valid = valid && origin_valid;
      pass = valid;
      if (!origin_valid) {
        let ref = pullRequest.data.head.ref
        let forkurl = `${that_repo.html_url}`
        let commiturl = `[${bad_origin}](${forkurl}/tree/${bad_origin})`
        forkurl = `[${that_repo.full_name}@${ref}](${forkurl}/tree/${ref})`
        MSG = `${MSG}
## :x: DANGER :x:

### DO NOT MERGE THIS PULL REQUEST

The fork ${forkurl} has divergent history and contains an invalid commit (${commiturl}).

### For the Pull Request Author

@${pullRequest.data.user.login}, if you want to contribute your changes, **you must [delete your fork](https://docs.github.com/en/repositories/creating-and-managing-repositories/deleting-a-repository)** and re-fork this repository.
`;
        core.setOutput("VALID", valid);
        core.setOutput("MSG", MSG);
        if (fail_on_error) {
          core.setFailed(MSG);
          process.exit(1);
        } else {
          console.log(MSG);
        }
      }
    }
    console.log(`checking files in the pull request`);
    // What files are associated? ----------------------------------------------
    const { data: pullRequestFiles } = await octokit.pulls.listFiles({
      owner: repository[0],
      repo: repository[1],
      pull_number: Number(PR),
    }).catch(err => { console.log(err); return err; } );
    
    // --- CHECK: pull request files exist
    if (pullRequestFiles) {
      const files = pullRequestFiles.map(getFilename);
      // filter out the files that are not GHA files
      let valid_files = files.filter(isNotWorkflow);
      // --- CHECK: no workflow files exist
      //     we have a valid PR if the valid file array is unchanged after 
      //     filtering for .github files.
      let workflow_valid = valid_files.length == files.length;
      valid = valid && workflow_valid;
      // --- CHECK: no mix of workflow and regular files
      if (!workflow_valid) {
        let invalid_files = files.filter(e => !isNotWorkflow(e));
        let inv = invalid_files.join("\n - ");
        if (valid_files.length > 0) {
          pass = false;
          // If we are not valid, we need to check if there is a mix of files
          let vf = valid_files.join("\n - ");
          MSG = `${MSG}
## :warning: WARNING :warning:

This pull request contains a mix of workflow files and regular files. **This could be malicious.** No preview will be created.

regular files:    
 - ${vf}

workflow files:    
 - ${inv}
`;
        } else {
          // NOTE: This does not cause a failure in the build because this could
          //       legitimate reason for modification of workflows
          MSG = `${MSG}

## :information_source: Modified Workflows

This pull request contains modified workflow files and no preview will be created.

Workflow files modified: 
 - ${inv}

**If this is not from a trusted source, please inspect the changes for any malicious content.**`;
        }
      }
      console.log(`Files in PR: ${files.join(", ")}`);
    } else {
      MSG = `${MSG}

## :warning: No files were found in the pull request :warning:

This could mean that this pull request was spoofed, but the details are unclear.`;
      valid = false;
      pass = valid;
    }
  }
  console.log(`Is valid?: ${valid}`);
  core.setOutput("VALID", valid);
  if (fail_on_error && !pass) {
    core.setFailed(MSG);
  } 
  if (MSG == "") {
    MSG = `## :ok: Pre-flight checks passed :smiley:

This pull request has been checked and contains no modified workflow files${(bad_origin=='')?' or spoofing':', spoofing, or invalid commits'}.`;
    if (pullRequest.data.author_association == "NONE") {
      // First-time contributors need their PRs approved.
      MSG = `${MSG}\n\nIt should be safe to **Approve and Run** the workflows that need maintainer approval.`;
    } else {
      MSG = `${MSG}\n\nResults of any additional workflows will appear here when they are done.`;
    }
  } 
  core.setOutput("MSG", MSG);
}


try {
  run();
} catch(error) {
  core.setFailed(error.message);
}
