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
    // HTTP errors turn into a failed run --------------------------------------
    console.log(err);
    core.setFailed(`There was a problem with the request (Status ${err.status}). See log.`);
    process.exit(1);
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
