## Rationale

The idea for these originated with from an article on the GitHub security blog:
https://securitylab.github.com/research/github-actions-preventing-pwn-requests.

My use-case is to create a staging area for generated content so that we can
have a single source of truth for RMarkdown (and maybe Jupyter) documents 
without needing to rely on users to compile the documents on their own 
machines. If you are accepting pull requests from people all over the world for
your website that hosts generated content, you want to make it difficult for
anyone to insert malicious code in your publishing workflow. **This set of
actions provides tools to validate, download artifacts from, and create
comments on pull requests from forked repositories**. 

In the end, the workflow looks like this:

![Workflow of a Pull Request](https://raw.githubusercontent.com/zkamvar/stunning-barnacle/main/img/pr-flow.dot.svg)

Workflows created from these actions can be found in [The {sandpaper} 
package](https://github.com/carpentries/sandpaper/tree/main/inst/workflows/).

## Example

Assuming you have a workflow called "Receive Pull Request" that stores a text
artifact of the PR number in a file called `pr/NUM`, the resulting workflow to
check the pull request and comment on it would look like this: 

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

The [GitHub Security Lab Article](https://securitylab.github.com/research/github-actions-preventing-pwn-requests) suggests to use `pull_request` trigger for running potentially unsafe code and passing textual artifacts to a workflow triggered by `workflow_run`. Much of it was written using the github-script action, which allows you to write JavaScript inside of the YAML file, but there were a few caveats pointed out in the article, namely:

> **Incoming data from artifacts is potentially untrusted.** When used in a safe manner, like reading PR numbers or reading a code coverage text to comment on the PR, it is safe to use such untrusted data in the privileged workflow context. However if the artifacts were, for example, binaries built from an untrusted PR, it would be a security vulnerability to run them in the privileged `workflow_run` workflow context. Artifacts resulting from untrusted PR data are themselves untrusted and should be treated as such when handled in privileged contexts.

### Unsafe artifacts

The reason why incoming data from artifacts is potentially untrusted is because [It is possible to modify a pull request workflow file](https://github.community/t/prevent-actions-from-running-if-actions-yaml-files-are-modified/152604?u=zkamvar), which means that someone who wanted to insert malicious code could just modify the workflow file to spoof a different PR number. The code in the article left it as an exercise for the reader to figure out how to ensure that the PR artifact was genuine.

This is why I created `check-valid-pr`, which will take a PR number and expected SHA and tell you it's valid on three conditions:

1. the PR head SHA matches the expected SHA
2. the PR is open
3. none of the files in the PR are a workflow

### JavaScript in YAML? :see_no_evil:

I understand that the article was mostly for demonstration purposes, but I am interested in creating managable workflows for a semi-captive audience of hundreds who may or may not be experienced with git and are likely not to be experience with JavaScript. At the moment, The Carpentries stack is embedded within each lesson repository, and it's a bit of a pain to make sure they are up-to-date because we rely on a shared git history between the original lesson template and the lesson repository to make pull requests. When the pull request does come in, it involves several commits and a lot of file changes that are incomprehensible unless you are deeply embedded in Jekyll. Effectively, it's frustrating for maintainers to handle these updates because a lot of the time, they involve merge conflicts. 

The new lesson template will separate the content from the tooling needed to render the website so that updates will be applied universally, but the workflows still need to live inside each repository, and updating JavaScript inside of YAML is... madness. This is why I've decided to convert all of the github-script action code into stand-alone actions. 
