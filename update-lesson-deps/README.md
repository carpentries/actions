# update-lesson-deps

This will update the dependencies for Carpentries lessons using {renv}. It is
important to note that this action is not independent. It requires the following
items:

 - `RENV_PATHS_ROOT` must be defined in the job environment

# Usage

Inputs available

- `cache-version` - default `1`. If you need to invalidate the existing cache pass any other number and a new cache will be used.

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

