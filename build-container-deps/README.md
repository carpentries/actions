# Manage dependencies required for lesson builds

This composite workflow performs all the prerequisite checks and validation steps to carry out a full lesson build and deployment.

It comprises five steps:

- Setup Lesson Dependencies:

  Runs the Docker container `setup_lesson_deps.R` script to install operating system level container dependencies specific to the current lesson.

- Check renv status:

  Checks if renv is used in this lesson, and if so, if a package cache is available to reuse.

- Fail/Warn on renv cache availability:

  If renv is required but no cache exists, the build will fail, prompting the user to run the Check for Updated Packages and Apply Package Cache workflows.

- Restore renv Dependencies:

  Processes the renv lockfile and installs any required packages that were not available in the package cache.

- Override any Workbench packages:

  If any specific Workbench package versions were supplied, install them, overriding any installed as part of the renv cache restore.

### Access tokens

This action requires the use of caching, either via GitHub or AWS.

#### AWS

If the lesson repository is part of the official Carpentries organisations, then this will be handled automatically as these secrets are set on the organisational repo by the Carpentries Technology Team.

You will not need to set any tokens if your repository is part of the `carpentries`, `swcarpentry`, `datacarpentry`, `carpentries-incubator` or `carpentries-lab` organisations.

#### GitHub

If the lesson repository is *not* part of the official Carpentries organisations, then the workflows will attempt to use the default GITHUB_TOKEN, but this has limitations.

We recommend that for non-Carpentries organisation repositories, users create and add a SANDPAPER_WORKFLOW Personal Access Token for their repo to allow workflows to carry out administrative tasks.


## Inputs

### `WORKBENCH_TAG`

Override Workbench version tag, e.g. "v0.15.0", "dev-0.2.3", or "latest".

Version tags can be found on the [workbench-docker Dockerhub](https://hub.docker.com/r/carpentries/workbench-docker/tags)

- required: false
- default: 'latest'

### `CACHE_VERSION`

Optional renv cache version override.

When processing the renv lockfile, a cache is generated and stored on GitHub or AWS (see above) using a hashsum of the lockfile as a key.
If you already have a specific renv cache that you wanto reuse (for example if certain new packages fail to install), you can supply it here.

- required: false
- default: ''

### `LESSON_PATH`
    
Path to the lesson directory within the container.

- required: false
- default: '/home/rstudio/lesson'

### `role-to-assume`

AWS role used to get authorised access token for the Carpentries bot.

This should not be set by end users, and is used only for official Carpentries repositories.

- required: false

### `aws-region`

AWS region used to get authorised access token for the Carpentries bot.

This should not be set by end users, and is used only for official Carpentries repositories.

- required: false


## Environment Variables

These variables can be set in your repository to allow specific package versions to be used at CI build time.

NOTE: this is different from supplying GitHub URLs for the Workbench packages at the end of a config.yaml, which is intended for local use or specific forks of packages.
As such, this does not support forks, but previous package releases only.

### VARNISH_VER

A specific {varnish} version to use for this build.

- required: false
- default ''

### SANDPAPER_VER

A specific {sandpaper} version to use for this build.

- required: false
- default ''

### PEGBOARD_VER

A specific {pegboard} version to use for this build.

- required: false
- default ''
