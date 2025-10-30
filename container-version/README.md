# Get Workbench Docker Container version

This composite workflow gets the version number of the current [workbench-docker](https://hub.docker.com/r/carpentries/workbench-docker/tags) image used to build the lesson.
It also gets any previous versions used, if the `.github/workbench-docker-version.txt` file exists.

It comprises four steps:

- Get Container Version Used

  Gets the container version either from Dockerhub (if default 'latest') or from the user-inputted WORKBENCH_TAG value.

- Check version file exists

  Checks if the `.github/workbench-docker-version.txt` exists.

- Get Previous Container Version Used

  If the `.github/workbench-docker-version.txt` file exists, get the version number from this file.

- Trigger Update Cache Workflow?

  Compares the current and last successful build workbench versions, and if they are different then the `update-cache` workflow will be triggered automatically.

NOTE: If WORKBENCH_TAG is empty, then the input to this workflow will default to 'latest'.
The actual version corresponding to the 'latest' tag will be resolved by querying the Dockerhub API.
This version tag will be used in subsequent build and renv caching steps.


## Inputs

### WORKBENCH_TAG:

Override Workbench version tag, e.g. "v0.15.0", "dev-0.2.3".

- required: false
- default: 'latest'

### renv-needed:

Is renv required for this lesson?

- required: true


## Outputs

### container-version

If the default WORKBENCH_TAG is 'latest', then this output value will be the resolved actual version tag from Dockerhub for 'latest'.

- value: The current validated Docker container version

### last-container-version

If a previous build succeeded, then the `container-version` tag will be stored in the `.github/workbench-docker-version.txt` file.

- value: Previous successful build Docker container version

### workbench-container-file-exists

Does the `.github/workbench-docker-version.txt` file exist?

This is used in other workflows to quickly verify whether the [record-container-version](../record-container-version/README.md) action needs to be run.

- value: `true` or `false`
