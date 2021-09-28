# setup-sandpaper

This action is modified from
[r-lib/actions/setup-r-dependencies](https://github.com/r-lib/actions) to setup
sandpaper for use in Carpentries lessons. The vast majority of this workflow was
written by Jim Hester at RStudio. Zhian Kamvar mostly just added tweaks.


It uses the following process:

- Installing [pak](https://pak.r-lib.org/)
- Setting up a dependency cache using [actions/cache](https://github.com/actions/cache).
- Installing system dependencies if needed using [rstudio/r-system-requirements](https://github.com/rstudio/r-system-requirements).
- Printing the installed session info using [sessioninfo](https://github.com/r-lib/sessioninfo).

# Usage

Inputs available

- `cache-version` - default `1`. If you need to invalidate the existing cache pass any other number and a new cache will be used.
- `extra-packages` - One or more extra package references to install. Separate each reference by newlines or commas for more than one package.

Basic:
```yaml
steps:
- uses: actions/checkout@master
- uses: r-lib/actions/setup-r@v1
- uses: carpentries/actions/setup-sandpaper@main
  with:
    cache-version: 2
    extra-packages: |
      ggplot2
      rcmdcheck
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributions

Contributions are welcome!
