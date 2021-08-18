# Check Valid PR action

This action checks that a pull request number is not closed, does not contain modification to workflow files, and is identical to a sha of the PR that launched the workflow.

## Inputs

### `pr`

**Required** The pull request number

### `sha`

The expected sha for the head commit of the pull request. This is optional, but
is very useful in runs that are triggered from pull request workflow runs.

### `repo`

**Required** The value of the repository. Defaults to `github.repository`

### `token`

**Required** The default token for authorization. Defaults to `github.token`

## Outputs

### `VALID`

Tells you if the Pull Request is valid (e.g. it exists and does not modify any actions files)

### `payload`

The pull request payload if it's not a spoof or closed pull request. 

## Example usage

This example is a bit involved because it also involves a script that downloads the PR artifact first (taken from https://securitylab.github.com/research/github-actions-preventing-pwn-requests).

```yaml
name: "Validate Pull Request"

on:
  workflow_run:
    workflows: ["Receive Pull Request"]
    types:
      - completed

jobs:
  upload:
    runs-on: ubuntu-latest
    if: >
      ${{ github.event.workflow_run.event == 'pull_request' &&
      github.event.workflow_run.conclusion == 'success' }}
    steps:
      - name: 'Download artifact'
        uses: carpentries/actions/download-workflow-artifact@main
        with:
          run: ${{ github.event.workflow_run.id }}
          name: pr

      - name: "Get PR Number"
        id: get-pr
        run: |
          unzip pr.zip
          echo "::set-output name=NUM::$(<./NUM)"
      
      - name: "Check PR"
        id: check-pr
        uses: carpentries/actions/check-valid-pr@main
        with:
          pr: ${{ steps.get-pr.outputs.NUM }}
          sha: ${{ github.events.workflow_run.head_commit.sha }}
          
      - name: "Run if valid"
        if: ${{ steps.check-pr.outputs.VALID == 'true'}}
        run: |
          echo "It's valid!"
          echo ${{ steps.check-pr.outputs.payload }}

      - name: "Run if invalid"
        if: ${{ steps.check-pr.outputs.VALID == 'false'}}
        run: |
          echo "It's not valid"
          echo ${{ steps.check-pr.outputs.payload }}
```
