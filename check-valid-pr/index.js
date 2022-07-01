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
  const allow_self = core.getInput('allow-self');
  const octokit    = github.getOctokit(myToken)

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
  let valid = pullRequest.data.state == 'open';
  let msg = `Pull Request ${PR} was previously merged`;
  let PR_msg = "";

  if (sha) {
    // VALIDITY: pull request is IDENTICAL to the provided sha
    valid = valid && pullRequest.data.head.sha == sha;
    msg = `PR #${PR} sha (${pullRequest.data.head.sha}) does not equal the expected sha (${sha})`;
  }

  if (valid) {
    core.setOutput("MSG", '');
    // VALIDITY: bad commit does not exist
    let this_repo = pullRequest.data.base.repo;
    let that_repo = pullRequest.data.head.repo;
    // BUT, if we are in a branch in our own repo, then we can allow it because
    // GitHub keeps track of old refs, even if they have been deleted. 
    let is_a_fork = true;
    if (allow_self) {
      let is_a_fork = !this_repo.full_name === that_repo.full_name
    }
    if (bad_origin != '' && is_a_fork) {
      let bad_origin_request = `GET /repos/{owner}/{repo}/commits?per_page=1?sha=${bad_origin}`
      const { data: pullRequestCommits } = await octokit.request(bad_origin_request, {
        owner: pullRequest.data.user.login,
        repo: repository[1]
      }).catch(err => { 
        if (err.status == '404') {
          // status 404 means that we did not see a commit so we can move on.
          return(null);
        } else {
          console.log(err);
          core.setFailed(`There was a problem with the request (Status ${err.status}). See log.`);
          process.exit(1);
        }
      } );

      // If we get the bad commit back, then the PR should be closed and the 
      // author should be encouraged to remove their repository 
      valid = pullRequestCommits === null;
      if (!valid) {
        let ref = pullRequest.data.head.ref
        let forkurl = `${pullRequest.data.head.repo.html_url}`
        let commiturl = `[${bad_origin}](${forkurl}/tree/${bad_origin})`
        forkurl = `[${pullRequest.data.head.repo.full_name}@${ref}](${forkurl}/tree/${ref})`
        PR_msg = `${PR_msg}
## :x: DANGER :x:

### DO NOT MERGE THIS PULL REQUEST

The fork ${forkurl} has divergent history and contains an invalid commit (${commiturl}).

### For the Pull Request Author

@${pullRequest.data.user.login}, if you want to contribute your changes, **you must [delete your fork](https://docs.github.com/en/repositories/creating-and-managing-repositories/deleting-a-repository)** and re-fork this repository.
`;
        core.setOutput("VALID", valid);
        core.setOutput("MSG", PR_msg);
        core.setFailed(PR_msg);
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
    
    if (pullRequestFiles) {
      const files = pullRequestFiles.map(getFilename);
      // filter out the files that are not GHA files
      let valid_files = files.filter(isNotWorkflow);
      // we have a valid PR if the valid file array is unchanged
      valid = valid && valid_files.length == files.length;
      if (!valid) {
        let invalid_files = files.filter(e => !isNotWorkflow(e));
        let inv = invalid_files.join("\n - ");
        PR_msg = `${PR_msg}

## :information_source: Modified Workflows

This pull request contains modified workflow files and no preview will be created.

Workflow files modified: 
 - ${inv}

**If this is not from a trusted source, please inspect the changes for any malicious content.**`;
        if (valid_files.length > 0) {
          // If we are not valid, we need to check if there is a mix of files
          let vf = valid_files.join("\n - ");
          PR_msg = `${PR_msg}
## :warning: WARNING :warning:

This pull request contains a mix of workflow files and regular files. **This could be malicious.**

regular files:    
 - ${vf}

workflow files:    
 - ${inv}
`;
        }
      }
      console.log(`Files in PR: ${files.join(", ")}`);
    } else {
      console.log(`No files found.`);
      valid = false;
    }
  } else {
    console.log(msg);
  }
  console.log(`Is valid?: ${valid}`);
  core.setOutput("VALID", valid);
  if (PR_msg != "") {
    core.setFailed(PR_msg);
  } else {
    PR_msg = `## :ok: Pre-flight checks passed :smiley:

This pull request has been checked and contains no modified workflow files, spoofing, and invalid commits.`;
    if (pullRequest.data.author_association == "NONE") {
      // First-time contributors need their PRs approved.
      PR_msg = `${PR_msg}\n\nIt should be safe to **Approve and Run** the workflows that need maintainer approval.`;
    } else {
      PR_msg = `${PR_msg}\n\nResults of any additional workflows will appear here when they are done.`;
    }
  }
  core.setOutput("MSG", PR_msg);
}


try {
  run();
} catch(error) {
  core.setFailed(error.message);
}
