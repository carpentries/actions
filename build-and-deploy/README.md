# Perform lesson build and deployment

This composite workflow performs the build and deploy step

It comprises one step:

- Run Container and Build Site

  Runs the Docker container build process.


## Inputs

### reset

Clean the site output folder and rebuild from scratch.

- required: false
- default: false

### skip-manage-deps

If `TRUE`, dependency management at build and deploy time will NOT be processed, defaults to `FALSE`.

Set this to TRUE to force dependency management to be handled in the separate package cache update and apply cache steps in the Dockerised CI workflow.

When using the Docker container dependency management scripts, this can safely be set to TRUE.
Normal non-Docker invocations should leave this unset or FALSE.

- required: false
- default: false
