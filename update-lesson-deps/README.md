# update-lesson-deps

This will update the dependencies for Carpentries lessons using {renv}. It is
important to note that this action is not independent. It requires the following
items:

 - R must be set up
 - `RENV_PATHS_ROOT` must be defined in the job environment

# Usage

Inputs available

- `cache-version` - default `1`. If you need to invalidate the existing cache pass any other number and a new cache will be used.
- `update` - default `true`. If you want to use this strictly for discovering
  new packages and not updating the packages that you already have, then this 
  will be used strictly for discovery.
- `repos` - The repositories to recognize in {renv}. default three carpentries repositories. You can use any valid R vector, but it must not contain any functions other than `c()` to prevent malicious code insertions.
- `profile` - the {renv} profile to use. default is 'lesson-requirements', but you can set this to '' for the default profile.

Basic:
```yaml
steps:
- uses: actions/checkout@master
- uses: r-lib/actions/setup-r@v1
- uses: carpentries/actions/update-lesson-deps@main
  with:
    cache-version: ${{ secrets.CACHE_VERSION }}
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributions

Contributions are welcome!

