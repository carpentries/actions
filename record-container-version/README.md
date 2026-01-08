# Set Workbench Docker Container version

This composite workflow writes the `github/workbench-docker-version.txt` file to the calling repo.

This file is populated with the version number of the [workbench-docker](https://hub.docker.com/r/carpentries/workbench-docker/tags) version tag used in the last successful build.

It comprises six steps:

- Validate Current Org and Workflow

  Checks if the repo and workflow are part of the official Carpentries organisation, using the [validate-org-workflow](../validate-org-workflow/README.md) composite action.

- Configure AWS credentials via OIDC / Set PAT from AWS Secrets Manager

  If the repo and workflow are part of the official Carpentries organisation, gets the access token to use in subsequent steps from AWS Secrets Manager.

  If the repo/org is not part of the Carpentries, the default GITHUB_TOKEN will be used.

- Validate token

  Checks if the AWS or GitHub access token has sufficient permissions to create PRs in this repository.

- Record Container Version Used

  Writes the Workbench Docker version used in the build to the `.github/workbench-docker-version.txt` file, and adds it for commit.

- Create Workbench Version PR / Auto-merge Workbench Version PR

  As the `workbench-docker-version.txt` file is in the `.github` folder, we need to raise a PR. If successful, this will be auto-merged.
 
- Trigger checks

  If the repo/org is not part of the Carpentries, and the default GITHUB_TOKEN is used, the PR needs to be checked for validity by triggering the {sandpaper} pr-comment.yaml workflow.

  In either case, the PR comment step will be run automatically.


## Inputs

### CONTAINER_VER

The Workbench Docker version tag, e.g. "v0.15.0", "dev-0.2.3".

This is resolved by the [container-version](../container-version/README.md) composite action.

- required: true

### token

The access token to use for validation - typically a user would provide the GITHUB_TOKEN or SANDPAPER_WORKFLOW token to this action.

If the repo and workflow are part of the official Carpentries organisation, the AWS access token will override whatever is provided to this input.

- required: true

### role-to-assume

AWS role used to get authorised access token for the Carpentries bot.

This should not be set by end users, and is used only for official Carpentries repositories.

- required: false

### aws-region

AWS region used to get authorised access token for the Carpentries bot.

This should not be set by end users, and is used only for official Carpentries repositories.

- required: false
