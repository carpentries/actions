# Axe Shauns

This is a repository for Zhian Kamvar's GitHub actions.

test2

## Available Actions

### Check Valid PR

This checks that a PR has an expected sha, is open, and does not modify any of
the GitHub workflows. It's intended to run from the completion of a job that
receives a pull request and writes a PR number to an artifact.

The idea for this originated with from an article on the GitHub security blog:
https://securitylab.github.com/research/github-actions-preventing-pwn-requests.

usage:

```yaml
on:
  workflow_run:
    workflows: ["Receive Pull Request"]

jobs:
  test-pr-artifact:
    runs-on: ubuntu-latest
    steps:
      - name: "Extract PR Number"
        ...snip...
      - name: "Check PR"
        id: check-pr
        uses: zkamvar/actions/check-pr@main
        with:
          pr:    ${{ steps.get-pr.outputs.NR }}
          repo:  ${{ github.repository }}
          sha:   ${{ github.events.workflow_run.head_commit.sha }}
          token: ${{ secrets.GITHUB_TOKEN }}
```
