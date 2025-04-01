# setup-deps

This will set up the dependencies for Carpentries lessons using {renv}. 
It is important to note that this action is not independent.
It requires the following items:

 - `RENV_PATHS_ROOT` must be defined in the job environment
 - R and the {sandpaper} package must be available (see `setup-sandpaper`)

# Usage

Inputs available:

- `cache-version` : An arbitrary cache number to use to identify this cache, default `1`. If you need to invalidate the existing cache pass any other number and a new cache will be used. You can use a secret called `CACHE_VERSION` set to a date for to reset the cache without needing to commit it.

## Example

```yaml
steps:
- uses: actions/checkout@v4
- uses: r-lib/actions/setup-r@v2
- uses: carpentries/actions/setup-sandpaper@main
  with:
    cache-version: ${{ secrets.CACHE_VERSION }}
- uses: carpentries/actions/setup-lesson-deps@main
  with:
    cache-version: ${{ secrets.CACHE_VERSION }}
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributions

Contributions are welcome!
