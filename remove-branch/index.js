const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  // This should be a token with access to your repository scoped in as a secret.
  // The YML workflow will need to set myToken with the GitHub Secret Token
  // myToken: ${{ secrets.GITHUB_TOKEN }}
  // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
  const myToken    = core.getInput('token');
  const prefix     = core.getInput('prefix');
  const PR         = core.getInput('pr');
  const repository = core.getInput('repo').split('/');
  const octokit    = github.getOctokit(myToken)


  const ref        = `heads/${prefix}-${PR}`

  // Check if ref exists -------------------------------------------------------
  const pullRequest = await octokit.git.getRef({
    owner: repository[0],
    repo: repository[1],
    ref: ref
  }).catch(err => { 
    if (core.isDebug()) {
      console.log(err);
    }
    if (err.status == '404') {
      // 404 status is okay for us. Sometimes the branch is not created --------
      core.info("Branch ${prefix}-${PR} does not exist. Nothing to do.")
      process.exit(0);
    } else {
      // any other HTTP errors turn into a failed run --------------------------
      core.setFailed(`There was a problem with the request (Status ${err.status}). See log.`);
      process.exit(1);
    }
  });

  // Remove ref ----------------------------------------------------------------
  const id = await octokit.git.deleteRef({
    owner: repository[0],
    repo: repository[1],
    ref: ref
  }).catch(err => { 
    // HTTP errors turn into a failed run --------------------------------------
    console.log(err);
    core.setFailed(`There was a problem with the request (Status ${err.status}). See log.`);
    process.exit(1);
  });

  console.log(`Deleted ${id}`)

}

try {
  run();
} catch(error) {
  core.setFailed(error.message);
}
