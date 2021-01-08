# Download workflow artifact

## Inputs

### `run`

**Required** The workflow run number

### `repo`

**Required** The value of the repository. Defaults to `github.repository`

### `token`

**Required** The default GITHUB TOKEN 

### `name`

**Required** The name of the artifact

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
        uses: zkamvar/actions/download-workflow-artifact
        with:
          run: 6
          repo: 'zkamvar/actions'
          token: ${{ secrets.GITHUB_TOKEN }}
          name: pr
```
