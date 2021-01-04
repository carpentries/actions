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
  }).catch(err => { console.log(err); return(err) });

  console.log(`pull request: ${pullRequest}`);

  // Has the PR merged? --------------------------------------------------------
  // 404 == unmerged OR just doesn't exist ಠ_ಠ 
  // 204 == merged
  const { status: pullRequestMerged } = await octokit.pulls.checkIfMerged({
    owner: repository[0],
    repo: repository[1],
    pull_number: Number(PR),
  }).catch(err => { 
    if (!err.status in [404, 204]) {
      console.log(err);
    }
    return err; 
  });

  if (!pullRequestMerged in [404, 204]) {
    core.setFailed(`There was a problem with the request (Status ${pullRequestMerged}). See log.`);
  }

  let valid = pullRequestMerged == 404;

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
      core.setFailed(`No files found.`);
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
