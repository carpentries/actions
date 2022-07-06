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

### `invalid`

A commit that should no longer exist on the production branch in the repository.
An example is a commit that has been removed by [`git-filter-repo`](https://github.com/newren/git-filter-repo/).
This will compare this hash against the incoming pull request branch. If a 404
is returned or the status is "diverged", then the invalid hash does not exist in
the branch and the PR is valid.

If the invalid hash is found within the branch (status "before" or "after"), then
the process fails. 

### `fail_on_error`

The default (`false`) mode of this action is to check all sources of potential
failure and report a single boolean for use in downstream events.
If `true` this action will fail when it encounters an invalid pull request, 
which is useful in a `pull_request_target` context.

## Outputs

### `VALID`

Tells you if the Pull Request is valid (e.g. it exists and does not modify any actions files)

### `payload`

The pull request payload if it's not a spoof or closed pull request. 

### `MSG`

This is a markdown-formatted message that can be used as a pull request comment
to inform the maintainers about the validity of the pull request to aid them in
deciding if they should run additional workflows. 

## Example usage

Note: This runs on `pull_request_target`, so it can not be modified by the
pull request author. If you want to run code from the pull request, be sure to
only run it after this finishes. 

```yaml
name: "internally receive PR"

on:
  pull_request_target:
    branches: [ "main" ]

jobs:
  test-pr:
    name: "Test pull request validity"
    if: ${{ github.event.action != 'closed' }}
    runs-on: ubuntu-latest
    outputs:
      is_valid: ${{ steps.check-pr.outputs.VALID }}
      MSG: ${{ steps.check-pr.outputs.MSG }}
    steps:
      - name: "Check PR"
        id: check-pr
        uses: carpentries/actions/check-valid-pr@add-invalid-hash
        with:
          pr: 2
          invalid: e83e2c9bdeb259fcb7b12ae21da8f6eac8ff34a4
      - name: "Comment on PR"
        id: comment-diff
        if: ${{ always() }}
        uses: carpentries/actions/comment-diff@main
        with:
          pr: ${{ github.event.number }} 
          body: ${{ steps.check-pr.outputs.MSG }}
```
