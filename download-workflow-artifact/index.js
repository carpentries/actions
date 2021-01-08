const core   = require('@actions/core');
const github = require('@actions/github');
var fs       = require('fs');

async function run() {
  // This should be a token with access to your repository scoped in as a secret.
  // The YML workflow will need to set myToken with the GitHub Secret Token
  // myToken: ${{ secrets.GITHUB_TOKEN }}
  // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
  const myToken    = core.getInput('token');
  const WF         = core.getInput('run');
  const repository = core.getInput('repo').split('/');
  const name       = core.getInput('name');
  const dir        = core.getInput('dir');
  const octokit    = github.getOctokit(myToken);

  var artifacts = await octokit.actions.listWorkflowRunArtifacts({
    owner: repository[0],
    repo: repository[1],
    run_id: WF
  }).catch(err => { 
    // HTTP errors turn into a failed run --------------------------------------
    console.log(err);
    core.setFailed(`There was a problem with the request (Status ${err.status}). See log.`);
    process.exit(1);
  });

  var matchArtifact = artifacts.data.artifacts.filter((artifact) => {
    return artifact.name == name
  })[0];

  var download = await octokit.actions.downloadArtifact({
    owner: repository[0],
    repo: repository[1],
    artifact_id: matchArtifact.id,
    archive_format: 'zip',
  }).catch(err => { 
    // HTTP errors turn into a failed run --------------------------------------
    console.log(err);
    core.setFailed(`There was a problem with the request (Status ${err.status}). See log.`);
    process.exit(1);
  });

  fs.writeFileSync(`${dir}/${name}.zip`, Buffer.from(download.data));

}

try {
  run();
} catch(error) {
  core.setFailed(error.message);
}
