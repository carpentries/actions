# Get renv environment properties

This composite workflow performs prerequisite validation and checks to verify if {renv} is used in a lesson, and if a package cache exists for this lesson.

It comprises six steps:

- Check for renv

  Checks if a renv profile and lockfile exists in this lesson.

- Calculate renv hash

  Calculates the hashsum of the renv lockfile, or uses a user-supplied CACHE_VERSION.

- Get Container Version Used

  Gets the version number of the current [workbench-docker](https://hub.docker.com/r/carpentries/workbench-docker/tags) image used to build the lesson.

- Validate Current Org and Workflow

  Checks if the repo and workflow are part of the official Carpentries organisation, using the [validate-org-workflow](../validate-org-workflow/README.md) composite action.

- Configure AWS credentials via OIDC / Set PAT from AWS Secrets Manager

  If the repo and workflow are part of the official Carpentries organisation, gets the access token to use in subsequent steps from AWS Secrets Manager.

- Restore renv from cache

  Gets the renv package cache file from AWS or GitHub.

  The format of the key used to save and restore from the cache is as follows:

  `${{ github.repository }}/${{ container-version }}_renv-${{ renv-cache-hashsum }}`


## Inputs

### WORKBENCH_TAG

Override Workbench version tag, e.g. "v0.15.0", "dev-0.2.3".

- required: false
- default: 'latest'

### CACHE_VERSION

Optional renv cache version override.

When processing the renv lockfile, a cache is generated and stored on GitHub or AWS (see above) using a hashsum of the lockfile as a key.
If you already have a specific renv cache that you wanto reuse (for example if certain new packages fail to install), you can supply it here.

- required: false
- default: ''

### LESSON_PATH
    
Path to the lesson directory within the container.

- required: false
- default: '/home/rstudio/lesson'

### skip-cache-check

If `true`, skip checking for cache availability and just report if renv is needed and the corresponding renv lockfile hashsum if so.
Defaults to `false`, doing a check on AWS or GitHub for a renv package cache matching the hashsum of the renv lockfile, or a user supplied CACHE_VERSION.

- required: false
- default: false

### token

The access token to use for validation - typically a user would provide the GITHUB_TOKEN or SANDPAPER_WORKFLOW token to this action.

If the repo and workflow are part of the official Carpentries organisation, the AWS access token will override whatever is provided to this input.

If the `skip-cache-check` input is `false` (the default), then the caller workflow would usually pass `${secrets.GITHUB_TOKEN}` here.
If `skip-cache-check` input is `true`, then no token needs to be passed.

- required: false

### role-to-assume

AWS role used to get authorised access token for the Carpentries bot.

This should not be set by end users, and is used only for official Carpentries repositories.

- required: false

### aws-region

AWS region used to get authorised access token for the Carpentries bot.

This should not be set by end users, and is used only for official Carpentries repositories.

- required: false


## Outputs

### renv-needed

Is renv needed?

- value: `true` or `false`

### renv-cache-hashsum

The renv cache hashsum.

This will either be calculated by calling hashFiles() on the renv lockfile, or by returning the user-supplied hashsum string.

- value: an alphanumeric hashsum string

### renv-cache-available

Is the renv cache with the given hashsum key available?

- value: `true` or `false`

### cache-matched-key

The matched cache key, if any

- value: an alphanumeric hashsum string

### cache-matched-size

The matched cache size, if any

- value: the size of the returned cache in bytes

### backup-cache-used

Was a previous cache version retrieved?

If the cache check returns a hit with a non-zero `cache-matched-size`, but the `renv-cache-hashsum` does not match, then there is a previous cache available that was generated using the same Workbench Docker version, and can be used instead.

Effectively, the following key was matched during the restore step, and not the complete key including the hashsum:

`${{ github.repository }}/${{ container-version }}_renv-`

- value: `true` or `false`
