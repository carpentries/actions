# Build Preflight Checks

This composite workflow comprises two steps:

- Check if the build should occur:

  Checks various workflow input `push` or `pull_request` events to verify that a build should occur.

- Check renv status:

  Checks if renv is used in this lesson, but does not check for the presence of a cache itself.


## Inputs

### `CACHE_VERSION`

Optional renv cache version override.

When processing the renv lockfile, a cache is generated and stored on GitHub or AWS (see above) using a hashsum of the lockfile as a key.
If you already have a specific renv cache that you wanto reuse (for example if certain new packages fail to install), you can supply it here.

- required: false
- default: ''


## Outputs

### do-build

Should a build occur?

value: `true` or `false`

### renv-needed:

Is renv needed?

value: `true` or `false`

### renv-cache-hashsum:

If renv is needed, return the renv lockfile hashsum, either calculated by calling `hashFiles()` on the lesson lockfile, or returning the user-supplied CACHE_VERSION string.

value: the renv lockfile hashsum
