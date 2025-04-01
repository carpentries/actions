# Summary:

The Workbench framework separates the lesson content (based on a template) from the tooling needed to render the eventual lesson website (the Workbench packages, i.e. pegboard, sandpaper and varnish).
In order for updates to be applied universally across all Workbench lessons on GitHub, the workflows that manage the updates, pull requests, and comments need to live inside each lesson repository.

Therefore, these actions are reused in each lesson repository to enable automated processes shared across all and any Workbench lesson.

## Why are these workflows required?

The Workbench needs to provide tools to validate, download artifacts from, and create comments on pull requests from forked lesson repositories.

## Real World Usage

Examples of real world usage of these workflows can be found in Carpentries lessons built by the Workbench, e.g.:

- Software Carpentry [git-novice](https://github.com/swcarpentry/git-novice/tree/main/.github/workflows)

# Details:

GitHub Actions are "privileged contexts", where it is down to the user to typically assure that any content coming in to a repository via Pull Requests (PRs) are safe.

PRs can include both code artifacts and pre-built (binary) artifacts.

**Incoming artifacts resulting from untrusted PR data are themselves untrusted and should be treated as such when handled in the privileged GitHub Action context..**

If the artifacts were, for example, binaries built from an untrusted PR, it would be a security vulnerability to run them in the privileged `workflow_run` workflow context.

These workflows provide a consistent and secure mechanism for incoming updates to be made to repositories that use these workflows, e.g. lessons that are built using the Workbench.

## History and Rationale

The idea for these actions originated from an article on the GitHub security blog: https://securitylab.github.com/research/github-actions-preventing-pwn-requests.

This article suggests to use a `pull_request` trigger for running potentially unsafe code and passing textual artifacts to a workflow triggered by `workflow_run`.

This ensures that malicious code cannot be inserted into a PR and automatically run by a workflow:

### Why are artifacts inherently unsafe?

[It is possible to modify a pull request workflow file](https://github.community/t/prevent-actions-from-running-if-actions-yaml-files-are-modified/152604?u=zkamvar), which means that someone who wanted to insert malicious code could modify the workflow file to spoof a different PR number.

## What is the solution? 

Each action in this repository performs a specific lesson management task so that users do not have to develop and manually perform these common housekeeping workflows themselves.

### check-valid-credentials

The `check-valid-credentials` action takes a GitHub authentication token (PAT, either fine-grained or classic) and checks that it has the right permissions to be used in subsequent Carpentries actions.

Please see the [check-valid-credentials documentation](check-valid-credentials/README.md)

### check-valid-pr

The `check-valid-pr` action takes a PR number and an expected hashed checksum (SHA), and will tell you the PR is valid on three conditions:

1. the PR head SHA matches the expected SHA
2. the PR is open
3. none of the files in the PR are a (modified) workflow

Please see the [check-valid-pr documentation](check-valid-pr/README.md)

### comment-diff

The `comment-diff` action takes a PR number and will comment on the PR when changes are made.

Please see the [comment-diff documentation](comment-diff/README.md)

### download-workflow-artifact

The `download-workflow-artifact` action takes a workflow number and will download an named artifact from that workflow.

Please see the [download-workflow-artifact documentation](download-workflow-artifact/README.md)

### remove-branch

The `remove-branch` action removes the staging branch generated from an incoming PR once that PR is closed.

Please see the [remove-branch documentation](remove-branch/README.md)

### setup-lesson-deps

The `setup-lesson-deps` action takes a Workbench-compatible repository (typically Carpentries-format lessons) and installs R packages required for the building and functioning of that lesson.

Please see the [setup-lesson-deps documentation](setup-lesson-deps/README.md)

### setup-sandpaper

The `setup-sandpaper` action provides a self-contained mechanism for installing required system dependencies for the {sandpaper} package.

Please see the [setup-sandpaper documentation](setup-sandpaper/README.md)

### update-lockfile

The `update-lockfile` action provides self-contained mechanism for updating an {renv} lockfile to document a given set of R packages in use at a particular point in time by a repository.

Please see the [update-lockfile documentation](update-lockfile/README.md)

### update-styles

** This action is DEPRECATED and no longer in use **

### update-workflows

The update-workflows` action checks for newer {sandpaper} versions and raises a PR to update if required.

Please see the [update-workflows documentation](update-workflows/README.md)


## Workflow Implementation

These actions act as a centralised and transparent pipeline to process Markdown and RMarkdown via automated means on GitHub.

This creates a staging area for generated content without needing to rely on users to compile the documents on their own machines.

This also makes it difficult for anyone to insert malicious code in the publishing workflow provided by these actions.

The workflow looks like this:

![Workflow of a Pull Request](https://raw.githubusercontent.com/zkamvar/stunning-barnacle/main/img/pr-flow.dot.svg)

Workflows created from these actions can be found in [The {sandpaper} package](https://github.com/carpentries/sandpaper/tree/main/inst/workflows/).

## Example

Assuming you have a workflow called "Receive Pull Request" that stores a text artifact of the PR number in a file called `pr/NUM`, the resulting workflow to check the pull request and comment on it would look like this: 

```yaml
name: "Validate and Comment on A Pull Request"

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
      
      - name: "Check PR"
        id: check-pr
        uses: carpentries/actions/check-valid-pr@main
        with:
          pr: ${{ steps.get-pr.outputs.NUM }}
          sha: ${{ github.events.workflow_run.head_commit.sha }}
          
      - name: "Run if valid"
        id: success-comment
        if: ${{ steps.check-pr.outputs.VALID == 'true'}}
        uses: carpentries/actions/comment-diff@main
        with:
          pr: ${{ steps.get-pr.outputs.NUM }}
          body: ":tada: Success! :tada:"

      - name: "Run if invalid"
        if: ${{ steps.check-pr.outputs.VALID != 'true' && steps.check-pr.outputs.payload }}
        uses: carpentries/actions/comment-diff@main
        with:
          pr: ${{ steps.get-pr.outputs.NUM }}
          body: ":see_no_evil: This PR is not valid!"
```
