const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  // This should be a token with access to your repository scoped in as a secret.
  // The YML workflow will need to set myToken with the GitHub Secret Token
  // myToken: ${{ secrets.GITHUB_TOKEN }}
  // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
  const myToken    = core.getInput('token');
  const PR         = core.getInput('pr');
  const body       = core.getInput('body');
  const repository = core.getInput('repo').split('/');
  const octokit    = github.getOctokit(myToken)


  // var fs = require('fs');
  // var issue_number = Number(fs.readFileSync('./NR'));
  // var body = String(fs.readFileSync('./diff.md', {encoding:'utf8', flag:'r'}));
  var page = 0;
  var myBot = -1;
  var { data: issue_comments } = await octokit.issues.listComments({
      owner: repository[0],
      repo: repository[1],
      issue_number: Number(PR),
      page: page

    }).catch(err => { 
      // HTTP errors turn into a failed run --------------------------------------
      console.log(err);
      core.setFailed(`There was a problem with the request (Status ${err.status}). See log.`);
      process.exit(1);
    });
  var bots;


  do {
    bots = issue_comments.map(item => item.type === "bot" && item.user.login == "github-actions[bot]");
    myBot = bots.indexOf(true);
    { data: issue_comments } = await octokit.issues.listComments({
      owner: repository[0],
      repo: repository[1],
      issue_number: Number(PR),
      page: page

    }).catch(err => { 
      // HTTP errors turn into a failed run --------------------------------------
      console.log(err);
      core.setFailed(`There was a problem with the request (Status ${err.status}). See log.`);
      process.exit(1);
    });
    page++;
  }
  while(myBot <= 0 && issue_comments.length > 0);

  console.log(issue_comments);
  console.log(myBot);

  // if (myBot > 0) {
  //   var id = await octokit.issues.updateComment({
  //     owner: repository[0],
  //     repo: repository[1],
  //     comment_id: issue_comments[myBot].id, 
  //     body: body 
  //   });
  // } else {
  //   var id = await octokit.issues.createComment({
  //     owner: repository[0],
  //     repo: repository[1],
  //     issue_number: Number(PR),
  //     body: body 
  //   });
  // }

}

try {
  run();
} catch(error) {
  core.setFailed(error.message);
}
