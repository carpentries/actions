# Comment on Pull Request

This action will add a comment to a pull request and will continue to update the
the comment as changes are made to the pull request. 

## Inputs

### `pr`

**Required** The pull request number

### `repo`

**Required** The value of the repository. Defaults to `github.repository`

### `token`

**Required** The default GITHUB TOKEN 

### `body`

**Required** The body of the pull Request

## Example usage

```yaml
name: "Comment on Pull Request"

on: 
  push:
    paths: ['.github/workflows/test-comment-pr.yaml', 'comment-diff/**']

jobs:
  test:
    runs-on: ubuntu-20.04
    name: Testing Comment on PR
    steps:
      - uses: actions/checkout@v2
      - id: comment-diff
        name: "PR Comment"
        uses: zkamvar/actions/comment-diff@main
        with:
          pr: 6
          repo: 'zkamvar/actions'
          token: ${{ secrets.GITHUB_TOKEN }}
          body: ":heavy_check_mark: The ID for this run is `${{ github.run_id }}`"
```
