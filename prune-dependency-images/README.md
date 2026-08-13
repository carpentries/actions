# prune-dependency-images

This composite action prunes old untagged dependency image digests from a GHCR package repository.

It uses the GitHub API to list package versions for either a user or organisation account, then deletes older untagged digests while keeping the newest ones requested by `keep-count`.

It performs one step:

- Prune Old Untagged Dependency Image Digests

  Uses `gh api` and `jq` to find container package versions with no tags and deletes the oldest versions beyond the retention limit.

## Inputs

### `github-token`

GitHub token used by the `gh` CLI.

- required: true

### `owner`

Owner of the container package, usually the repository owner.

- required: true

### `repository`

Repository name used to build the job summary link to the GHCR Packages tab.

- required: true

### `owner-type`

Type of the repository owner, either `User` or `Organization`.

- required: true

### `package-name`

Name of the dependency image package.

- required: true

### `keep-count`

Number of untagged digests to keep.

- required: false
- default: `1`

## Example

```yaml
steps:
- uses: carpentries/actions/prune-dependency-images@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    owner: ${{ github.repository_owner }}
    repository: ${{ github.event.repository.name }}
    owner-type: ${{ github.event.repository.owner.type }}
    package-name: ${{ github.event.repository.name }}-deps
    keep-count: 2
```
