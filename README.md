# Hello world javascript action

This action prints "Hello World" or "Hello" + the name of a person to greet to the log.

## Inputs

### `pr`

**Required** The pull request number

### `repo`

**Required** The value of the repository. Defaults to `github.repository`

### `sha`

The expected sha for the head commit of the pull request. This is optional, but
is very useful in runs that are triggered from pull request workflow runs.

### `token`

**Required** The default GITHUB TOKEN 

## Outputs

### `VALID`

Tells you if the Pull Request is valid (e.g. it exists and does not modify any actions files)

## Example usage

This example is a bit involved because it also involves a script that downloads the PR artifact first (taken from https://securitylab.github.com/research/github-actions-preventing-pwn-requests).

```yaml
on:
  workflow_run:
    workflows: ["Receive Pull Request"]

jobs:
  test-pr-artifact:
    runs-on: ubuntu-latest
    if: >
      ${{ github.event.workflow_run.event == 'pull_request' &&
      github.event.workflow_run.conclusion == 'success' }}
    steps:
      - name: 'Download artifact'
        uses: actions/github-script@v3.1.0
        with:
          script: |
            var artifacts = await github.actions.listWorkflowRunArtifacts({
               owner: context.repo.owner,
               repo: context.repo.repo,
               run_id: ${{github.event.workflow_run.id }},
            });
            var matchArtifact = artifacts.data.artifacts.filter((artifact) => {
              return artifact.name == "pr"
            })[0];
            var download = await github.actions.downloadArtifact({
               owner: context.repo.owner,
               repo: context.repo.repo,
               artifact_id: matchArtifact.id,
               archive_format: 'zip',
            });
            var fs = require('fs');
            fs.writeFileSync('${{github.workspace}}/pr.zip', Buffer.from(download.data));
            
      - name: "Get PR Number"
        id: get-pr
        run: |
          unzip pr.zip
          cho "::set-output name=NR::$(cat ./NR)"
      
      - name: "Check PR"
        uses: zkamvar/check-pr@main
        with:
          pr: ${{ steps.get-pr.outputs.NR }}
          repo: ${{ github.repository }}
          sha: ${{ github.events.workflow_run.head_commit.sha }}
          token: ${{ secrets.GITHUB_TOKEN }}
```
