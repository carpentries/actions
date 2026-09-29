# build-dependency-image

This composite action prepares and publishes a lesson dependency image to GHCR.

It builds on the current workflow-docker image by:
- installing any system and R package dependencies in a temporary builder stage
- copying the lesson tree and installed libraries into the final image
- pushing the image to the GHCR.io Packages container repository for a given user or organisation

It performs one build step:

- Build and Push Dependency Image

  Runs `docker/build-push-action` against a generated Dockerfile and publishes the resulting image tags.

## Inputs

### `workbench-tag`

Workbench base image tag to use for the dependency image build.

- required: true

### `github-token`

Token used during the Docker build.

- required: true

### `github-repository`

Repository in `owner/name` format.

- required: true

### `github-sha`

Commit SHA to check out in the cloned repository.

- required: true

### `exact-image`

Fully qualified versioned dependency image tag to push.

- required: true

### `latest-image`

Fully qualified `latest` dependency image tag to push.

- required: true


## Example

```yaml
steps:
- uses: actions/checkout@v6
- uses: carpentries/actions/build-dependency-image@v1
  with:
    workbench-tag: latest
    github-token: ${{ secrets.GITHUB_TOKEN }}
    github-repository: ${{ github.repository }}
    github-sha: ${{ github.sha }}
    exact-image: ghcr.io/carpentries/example-lesson:1.2.3
    latest-image: ghcr.io/carpentries/example-lesson:latest
```

