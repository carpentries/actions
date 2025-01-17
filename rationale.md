# Summary:

The Workbench framework separates the lesson content (based on a template) from the tooling needed to render the eventual lesson website (the Workbench packages, i.e. pegboard, sandpaper and varnish).
In order for updates to be applied universally across all Workbench lessons on GitHub, the workflows that manage the updates, pull requests, and comments need to live inside each lesson repository.

Therefore, these actions are reused in each lesson repository to enable automated processes shared across all and any Workbench lesson.

## Why are these workflows required?

The Workbench needs to provide tools to validate, download artifacts from, and create comments on pull requests from forked lesson repositories.

# Details:

> **Incoming data from artifacts is potentially untrusted.** When used in a safe manner, like reading PR numbers or reading a code coverage text to comment on the PR, it is safe to use such untrusted data in the privileged workflow context. However if the artifacts were, for example, binaries built from an untrusted PR, it would be a security vulnerability to run them in the privileged `workflow_run` workflow context. Artifacts resulting from untrusted PR data are themselves untrusted and should be treated as such when handled in privileged contexts.

## History and Rationale

The idea for these actions originated from an article on the GitHub security blog: https://securitylab.github.com/research/github-actions-preventing-pwn-requests.
This article suggests to use a `pull_request` trigger for running potentially unsafe code and passing textual artifacts to a workflow triggered by `workflow_run`.
This ensures that malicious code cannot be inserted into a PR and automatically run by a workflow:

### Why are artifacts inherently unsafe?

[It is possible to modify a pull request workflow file](https://github.community/t/prevent-actions-from-running-if-actions-yaml-files-are-modified/152604?u=zkamvar), which means that someone who wanted to insert malicious code could modify the workflow file to spoof a different PR number.

## What is the solution? 

Each action in this repository performs a specific lesson management task so that users do not have to develop and manually perform these common housekeeping workflows themselves.

### check-valid-credentials

Please see the [check-valid-credentials documentation](check-valid-credentials/README.md)

### check-valid-pr

The `check-valid-pr` action takes a PR number and expected SHA and tell you it's valid on three conditions:

1. the PR head SHA matches the expected SHA
2. the PR is open
3. none of the files in the PR are a workflow

Please see the [check-valid-pr documentation](check-valid-pr/README.md)

### comment-diff

Please see the [comment-diff documentation](comment-diff/README.md)

### download-workflow-artifact

Please see the [download-workflow-artifact documentation](download-workflow-artifact/README.md)

### remove-branch

Please see the [remove-branch documentation](remove-branch/README.md)

### setup-lesson-deps

Please see the [setup-lesson-deps documentation](setup-lesson-deps/README.md)

### setup-sandpaper

Please see the [setup-sandpaper documentation](setup-sandpaper/README.md)

### update-lockfile

Please see the [update-lockfile documentation](update-lockfile/README.md)

### update-styles

Please see the [update-styles documentation](update-styles/README.md)

### update-workflows

Please see the [update-workflows documentation](update-workflows/README.md)


## Workflow Implementation

The use-case is to create a staging area for generated content so that a single source of truth for markdown, RMarkdown, and maybe Jupyter documents without needing to rely on users to compile the documents on their own machines.
If you are accepting pull requests from people all over the world for your website that hosts generated content, you want to make it difficult for anyone to insert malicious code in your publishing workflow.

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

## JavaScript in YAML? :see_no_evil:



This article documents the creation of managable workflows for an audience of users who may or may not be experienced with git and are likely not to be experienced with JavaScript.
At the moment, The Carpentries stack is embedded within each lesson repository, and it's a bit of a pain to make sure they are up-to-date because we rely on a shared git history between the original lesson template and the lesson repository to make pull requests.
When the pull request does come in, it involves several commits and a lot of file changes that are incomprehensible unless you are deeply embedded in Jekyll. Effectively, it's frustrating for maintainers to handle these updates because a lot of the time, they involve merge conflicts. 

