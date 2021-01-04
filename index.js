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

  const pullRequest = await octokit.pulls.get({
    owner: repository[0],
    repo: repository[1],
    pull_number: Number(PR),
  }).catch(err => { 
    console.log(err);
    return err; 
  });

  // console.log(`pull request: ${JSON.stringify(pullRequest)}`);

  // Default: be cautious
  let valid = false;

  // Is the PR open? -----------------------------------------------------------
  if (!pullRequest.status > 400) {
    // Fail immediately if the PR doesn't exist or there's a server issue
    core.setFailed(`There was a problem with the request (Status ${pullRequest.status}). See log.`);
    process.exit(1);
  } else {
    valid = pullRequest.data.state == 'open';
  }

  if (valid) {
    // What files are associated? ------------------------------------------------
    const { data: pullRequestFiles } = await octokit.pulls.listFiles({
      owner: repository[0],
      repo: repository[1],
      pull_number: Number(PR),
    }).catch(err => { console.log(err); return err; } );
    
    if (pullRequestFiles) {
      const files = pullRequestFiles.map(getFilename);
      valid = valid && files.reduce(notAction, true);
      console.log(`Files in PR: ${files}`);
    } else {
      console.log(`No files found.`);
      valid = false;
    }
  } else {
    console.log(`Pull Request ${PR} was previously merged`)
  }

  console.log(`Is valid?: ${valid}`);
  core.setOutput("VALID", valid);

}


try {
  run();
} catch(error) {
  core.setFailed(error.message);
}
