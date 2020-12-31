const core = require('@actions/core');
const github = require('@actions/github');

try {
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
