# update-lockfile

This will update the dependencies for Carpentries lessons using {renv}.
It is important to note that this action is not independent.
It requires the following items:

- R must be set up
- `RENV_PATHS_ROOT` must be defined in the job environment

# Usage

Inputs available:

- `cache-version` : An arbitrary cache number to use to identify this cache, default `1`. If you need to invalidate the existing cache, pass any other number and a new cache will be used. You can use a secret called `CACHE_VERSION` set to a date for to reset the cache without needing to commit it.
- `update` : Update any out-of-date packages, default `true`. If you want to use this for discovering new packages and not updating the packages that you already have, then this will be used strictly for discovery.
- `repos` : The repositories to use in {renv}, default the three carpentries package repositories. You can use any valid R vector, but it must not contain any functions other than `c()` to prevent malicious code insertions.
- `profile` : The {renv} profile to use, default `'lesson-requirements'`. You can set this to an empty string (`''`) to use the default profile.

## Example

```yaml
steps:
- uses: actions/checkout@master
- uses: r-lib/actions/setup-r@v2
- uses: carpentries/actions/update-lesson-deps@main
  with:
    cache-version: ${{ secrets.CACHE_VERSION }}
    repos: |
      c(CRAN = 'https://cran.rstudio.com/')
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributions

Contributions are welcome!
