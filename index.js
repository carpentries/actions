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

  // You can also pass in additional options as a second parameter to getOctokit
  // const octokit = github.getOctokit(myToken, {userAgent: "MyActionVersion1"});

  const { data: pullRequest } = await octokit.pulls.get({
    owner: repository[0],
    repo: repository[1],
    pull_number: Int(PR),
  });

  console.log(pullRequest);
}


try {
  run()
  // `who-to-greet` input defined in action metadata file
  const pullRequest = core.getInput('pr');
  const repository  = core.getInput('repo');
  console.log(`Hello ${repository}/${pullRequest}!`);
  console.log(`Hello ${github.context.payload.repository.pulls_url}?`)
  const valid = github.repository == repository;
  core.setOutput("VALID", valid);
  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.log(`The event payload: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}
