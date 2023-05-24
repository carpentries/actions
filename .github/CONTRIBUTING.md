# Contributing to The Carpentries GitHub Actions

This outlines how to propose a change to The Carpentries GitHub Actions.

## Requirements

To contribute to this repository, your GitHub account _must_ be set up with
[commit signature
verification](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification).
The rational for this requirement is for two reasons:

 1. this repository is responsible for deploing all of The Carpentries official
    lessons along with hundreds of community-developed lessons and 
 2. the toolchains for the JavaScript actions in this repository are complex
    enough that we want to make sure that each contributor is who they say they
    are.

## Fixing typos

You can fix typos, spelling mistakes, or grammatical errors in the
documentation directly using the GitHub web interface.

## Bigger changes

If you want to make a bigger change, it's a good idea to first file an issue
and make sure someone from the team agrees that it’s needed.

If you’ve found a bug, please file an issue that illustrates the bug with a
minimal reproducible example. In the context of this repository, this will
usually be a link to a failing GitHub action in a lesson.

## Testing changes

Because it's difficult to reproduce a fully-featured GitHub Actions space locally,
the quickest way to test something is to create a brand new workbench lesson or
edit an existing test lesson:

1. create a new
   [Markdown](https://github.com/carpentries/workbench-template-md/generate) or
   [R Markdown](https://github.com/carpentries/workbench-template-rmd/generate)
   lesson.
2. modify the appropriate workflow files by replacing the action you are fixing
   with the appropriate repository and branch.
3. set up any conditions to trigger a response

For example, let's say @octocat wanted to create a pull request from the branch
`brrrr` in their fork to
[`setup-lesson-deps/`](https://github.com/carpentries/actions/tree/main/setup-lesson-deps/)
that would optimize package installation, they would create a new R Markdown
lesson, go into the `.github/workflows/sandpaper-main.yaml` workflow file and
make this change:

```diff
       - name: "Setup Package Cache"
-        uses: carpentries/actions/setup-lesson-deps@main
+        uses: octocat/actions/setup-lesson-deps@brrrr
         with:
           cache-version: ${{ secrets.CACHE_VERSION }}
```

They would then make a commit to add a new package and then link to this in the
pull request demonstrating that it works.

## Code of Conduct

Please note that The Carpentries GitHub Actions is released with a
[Contributor Code of Conduct](CODE_OF_CONDUCT.md). By contributing to this
project you agree to abide by its terms.
