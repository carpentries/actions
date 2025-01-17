# Carpentries GitHub Actions

This is a set of actions that facilitate constructing GitHub workflows that can:
- validate, comment on, and create pull requests
- set up dependencies for GitHub action runners to manage Workbench lesson builds
- update renv lockfiles to manage dependency specifications and versions
- update Workbench workflows, i.e. {sandpaper} version management

By providing these actions, repositories that use the Workbench framework can
benefit from reproducible and consistent workflows to manage these aspects of lesson
development by the Carpentries community and beyond.

## Why do we need these actions?

For a rationale of why these actions were created, see [the rationale document](rationale.md).

## Where are these actions used?

Several workflows created from these actions can be found in [The {sandpaper} 
package](https://github.com/carpentries/sandpaper/tree/main/inst/workflows/).
