# setup-sandpaper

This action is modified from [r-lib/actions/setup-r-dependencies](https://github.com/r-lib/actions) to setup {sandpaper} for use in Carpentries lessons.
The vast majority of this workflow was written by Jim Hester at RStudio. Zhian Kamvar added tweaks.

It uses the following process:

- Installing [remotes](https://remotes.r-lib.org/)
- Setting up a dependency cache using [actions/cache](https://github.com/actions/cache)
- Installing system dependencies if needed using [rstudio/r-system-requirements](https://github.com/rstudio/r-system-requirements)
- Printing the installed session info using [sessioninfo](https://github.com/r-lib/sessioninfo)

# Usage

Inputs available:

- `cache-version` : An arbitrary cache number to use to identify this cache, default `1`. If you need to invalidate the existing cache pass any other number and a new cache will be used. You can use a secret called `CACHE_VERSION` set to a date for to reset the cache without needing to commit it.
- `*-version` (e.g. `sandpaper-version`) the version of either sandpaper, pegboard, or varnish to use (for testing) in the remotes syntax. You can supply a specific GitHub location including a branch or commit, e.g. `'carpentries/sandpaper@branch'` which will use a branch from the Carpentries repo. This can be used to try alternate versions of sandpaper which can aid development.

## Example

```yaml
steps:
- uses: actions/checkout@v4
- uses: r-lib/actions/setup-r@v2
- uses: carpentries/actions/setup-sandpaper@main
  with:
    cache-version: ${{ secrets.CACHE_VERSION }}
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributions

Contributions are welcome!

# LOG

## 2025-01-17

 - Updated readme and example action versions

## 2023-08-22

 - added pegboard-version option and updated README after forgetting for a while.

## 2021-09-28

 - copied action from r-lib
 - modified action to use {remotes} because the process for {pak} was twice as long
