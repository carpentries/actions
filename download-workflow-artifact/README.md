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
```
