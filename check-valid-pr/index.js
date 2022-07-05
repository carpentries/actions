const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  // This should be a token with access to your repository scoped in as a secret.
  // The YML workflow will need to set myToken with the GitHub Secret Token
  // myToken: ${{ secrets.GITHUB_TOKEN }}
  // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
  const myToken    = core.getInput('token');
  const PR         = core.getInput('pr');
  const sha        = core.getInput('sha');
  const repository = core.getInput('repo').split('/');
  const bad_origin = core.getInput('invalid-hash');
  const octokit    = github.getOctokit(myToken);

  let valid = true; // true if valid and no workflow files are modified
  let pass  = true; // true if modified files are only content OR workflows, but otherwise valid
  let MSG = "";  // MSG output

  function getFilename(f) {
    return f.filename;
  }

  function isNotWorkflow(l) {
    return !l.startsWith('.github/');
  }

  // Access Pull Request -------------------------------------------------------
  const pullRequest = await octokit.pulls.get({
    owner: repository[0],
    repo: repository[1],
    pull_number: Number(PR),
  }).catch(err => { 
    // HTTP errors turn into a failed run --------------------------------------
    console.log(err);
    core.setFailed(`There was a problem with the request (Status ${err.status}). See log.`);
    process.exit(1);
  });

  // VALIDITY: pull request is still open
  valid = pullRequest.data.state == 'open';
  if (!valid) {
    console.log(`Pull Request ${PR} was previously merged`);
  }

  // VALIDITY: pull request is IDENTICAL to the provided sha
  if (sha) {
    valid = valid && pullRequest.data.head.sha == sha;
    pass = valid;
    if (!valid) {
      MSG = `## :X: DANGER :X: 

  **Do not merge this Pull Request**. This PR has been spoofed to look like #${PR} (HEAD @ ${pullRequest.data.head.sha}).`;
      core.setOutput("VALID", valid);
      core.setOutput("MSG", MSG);
      core.setFailed(MSG);
      process.exit(1);
    }
  }

  if (valid) {
    // VALIDITY: bad commit does not exist
    let that_repo = pullRequest.data.head.repo;
    // BUT, if we are in a branch in our own repo, then we can allow it because
    // GitHub keeps track of old refs, even if they have been deleted. 
    if (bad_origin != '') {
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
          console.log("404'd");
          console.log(err);
          return({data: null});
        } else {
          console.log(err);
          core.setFailed(`Failed to request commit comparison (Status ${err.status}). See log.`);
          process.exit(1);
        }
      });

      // If we get the bad commit back, then the PR should be closed and the 
      // author should be encouraged to remove their repository 
      valid = !comparison || !comparison.status || comparison.status == "diverged";
      pass = valid;
      if (!valid) {
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
        core.setFailed(MSG);
        process.exit(1);
      }
    }
    // create payload output if the PR is not spoofed
    core.setOutput("payload", JSON.stringify(pullRequest));
    // What files are associated? ----------------------------------------------
    const { data: pullRequestFiles } = await octokit.pulls.listFiles({
      owner: repository[0],
      repo: repository[1],
      pull_number: Number(PR),
    }).catch(err => { console.log(err); return err; } );
    
    // VALIDITY: pull request files exist
    if (pullRequestFiles) {
      const files = pullRequestFiles.map(getFilename);
      // filter out the files that are not GHA files
      let valid_files = files.filter(isNotWorkflow);
      // we have a valid PR if the valid file array is unchanged
      valid = valid && valid_files.length == files.length;
      // NOTE: we will pass this if ONLY workflows are modified (indicate bot
      // activity).
      if (!valid) {
        let invalid_files = files.filter(e => !isNotWorkflow(e));
        let inv = invalid_files.join("\n - ");
        if (valid_files.length > 0) {
          pass = false;
          // If we are not valid, we need to check if there is a mix of files
          let vf = valid_files.join("\n - ");
          MSG = `${MSG}
## :warning: WARNING :warning:

This pull request contains a mix of workflow files and regular files. **This could be malicious.**

regular files:    
 - ${vf}

workflow files:    
 - ${inv}
`;
        } else {
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
  if (!pass) {
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
