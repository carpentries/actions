const core   = require('@actions/core');
const github = require('@actions/github');
const fs     = require('fs');

async function run() {
  // This should be a token with access to your repository scoped in as a secret.
  // The YML workflow will need to set myToken with the GitHub Secret Token
  // myToken: ${{ secrets.GITHUB_TOKEN }}
  // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
  const myToken    = core.getInput('token');
  const PR         = core.getInput('pr');
  let   body;
  const path       = core.getInput('path');
  const repository = core.getInput('repo').split('/');
  const octokit    = github.getOctokit(myToken)


  if (path) {
    fs.stat(path, function(err, stat) {
      if(err == null) {
        console.log(`Path: ${path}`);
        body = String(fs.readFileSync(path));
      } else if(err.code === 'ENOENT') {
        // file does not exist
        core.setFailed(`File ${path} not found.`);
        process.exit(1);
      } else {
        core.setFailed(`File Error: ${err.code}`);
        process.exit(1);
      }
    });
    console.log(`Body: ${body}`);
  } else {
    body = core.getInput('body');
  }

  if (typeof body === undefined) {
    core.setFailed("No Body");
    process.exit(1);
  }


  var page = 0;
  var myBot = -1;
  var id = -1;
  var issue_comments = [{ "user" : { "type": "meat-popsicle", "login": "Corban Dallas" } }]
  var bots;

  do {
    var comments = await octokit.issues.listComments({
      owner: repository[0],
      repo: repository[1],
      issue_number: Number(PR),
      page: page,
      per_page: 100
    }).catch(err => { 
      // HTTP errors turn into a failed run --------------------------------------
      console.log(err);
      core.setFailed(`There was a problem with the request (Status ${err.status}). See log.`);
      process.exit(1);
    });
    issue_comments = comments.data;
    bots = issue_comments.map(item => item.user.type == "Bot" && item.user.login == "github-actions[bot]");
    myBot = bots.indexOf(true);
    if (myBot > -1) {
      id = issue_comments[myBot].id;
    }
    page++;
  }
  while(page < 3 && id < 0 && issue_comments.length > 0);

  if (page > 3) {
    console.log(comments);
    core.setFailed(`There was a problem scanning comments for https://github.com/${repository[0]}/${repository[1]}/pulls/${PR}/. Scanning 300 comments did not return any bots`);
    process.exit(1);
  }

  if (id >= 0) {
    var id = await octokit.issues.updateComment({
      owner: repository[0],
      repo: repository[1],
      comment_id: id,
      body: body 
    });
  } else {
    var id = await octokit.issues.createComment({
      owner: repository[0],
      repo: repository[1],
      issue_number: Number(PR),
      body: body 
    });
  }

}

try {
  run();
} catch(error) {
  core.setFailed(error.message);
}
