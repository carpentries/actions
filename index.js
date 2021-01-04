const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  // This should be a token with access to your repository scoped in as a secret.
  // The YML workflow will need to set myToken with the GitHub Secret Token
  // myToken: ${{ secrets.GITHUB_TOKEN }}
  // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
  const myToken    = core.getInput('token');
  const PR         = core.getInput('pr');
  const repository = core.getInput('repo').split('/');

  const octokit = github.getOctokit(myToken)
  console.log(repository);

  // You can also pass in additional options as a second parameter to getOctokit
  // const octokit = github.getOctokit(myToken, {userAgent: "MyActionVersion1"});

  function getFilename(f) {
    return f.filename;
  }

  function notAction(truth, l) {
    return truth && !l.startsWith('.github/');
  }

  // Check if the PR has merged
  // 
  const { status: pullRequestMerged } = await octokit.pulls.checkIfMerged({
    owner: repository[0],
    repo: repository[1],
    pull_number: Number(PR),
  }).catch(err => { console.log(err); return err; });

  const { data: pullRequestFiles } = await octokit.pulls.listFiles({
    owner: repository[0],
    repo: repository[1],
    pull_number: Number(PR),
  }).catch(err => { console.log(err); return err; } );
  
  if (!pullRequestMerged in [404, 204]) {
    throw `There was a problem with the request (Status ${pullRequestMerged}). See log.`;
  }

  if (pullRequestFiles) {
    const files = pullRequestFiles.map(getFilename);
    const valid = files.reduce(notAction, true);
  } else if (pullRequestFiles.header) {
    throw `Request for files threw an error (Status ${pullRequestFiles.header.status})`;
  } else {
    throw `No files associated with the pull request.`;
  }
  console.log(`Has Merged: ${JSON.stringify(pullRequestMerged)}`);
  console.log(`Files: ${files}`);
  console.log(`Any GitHub: ${valid}`);
  core.setOutput("VALID", valid && pullRequestMerged != 204);
}


try {
  run();
} catch(error) {
  core.setFailed(error.message);
}
