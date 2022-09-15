# Remove branch created via PR

The workflow in the main README shows that a staging branch is created from the PR. The branch name is `{prefix}-{pr}` (which at the moment is `md-outputs-PR-{pr}`) so that it's unique and tied to the PR. This branch is only relevant for the life of the PR, so it needs to be deleted once the PR is closed to avoid cluttering the repository. 

## Inputs

### `prefix`

**Required** The prefix of the branch. Defaults to `md-outputs-PR`

### `pr`

**Required** The pull request number

### `repo`

**Required** The value of the repository. Defaults to `github.repository`

### `token`

**Required** The default token for authorization. Defaults to `github.token`


## Example usage

This example assumes that you have an action on close that records the pull
request number.

```yaml
name: "Remove Temporary Branch"

on:
  workflow_run:
    workflows: ["Close Pull Request Signal"]
    types:
      - completed

jobs:
  delete:
    name: "Delete branch from Pull Request"
    runs-on: ubuntu-latest
    if: >
      github.event.workflow_run.event == 'pull_request' &&
      github.event.workflow_run.conclusion == 'success'
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
      - name: 'Remove branch'
        uses: carpentries/actions/remove-branch@main
        with:
          pr: ${{ steps.get-pr.outputs.NUM }}
```
