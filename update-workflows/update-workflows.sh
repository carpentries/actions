#!/usr/bin/env bash
set -eo pipefail

# Download and update sandpaper workflow files from an upstream repository
#
# usage: 
#   bash update-workflows.sh [UPSTREAM] [SOURCE] [CLEAN]
#
# args:
#   UPSTREAM - a version number from which to fetch the workflows. By default,
#     this is fetched from https://carpentries.r-universe.dev/packages/sandpaper
#   SOURCE - a CRAN-like repository from which to fetch a tarball of sandpaper
#     By default this is fetched from https://carpentries.r-universe.dev/
#   CLEAN files to clean as a pattern. Example: *.yaml will clean all the yaml
#     files, but will leave the yml files alone.
#
# example: Reset the workflow versions to that of 0.0.0.9041 from the drat
#   archives
#
# bash update-workflows.sh 0.0.0.9041 https://carpentries.github.io/drat/ *.yaml

# Fail if we aren't in a sandpaper repository
if [[ -r .github/workflows/sandpaper-main.yaml || -r .github/workflows/sandpaper-version.txt ]]; then
  echo "" > /dev/null
else
  echo "::error::This is not a {sandpaper} repository"
  exit 1
fi

# Set variables needed
UPSTREAM="${1:-current}"
SOURCE="${2:-https://carpentries.r-universe.dev}"
CLEAN="${3:-}"
CURRENT=$(cat .github/workflows/sandpaper-version.txt)

# Fetch upstream version from the API if we don't have that information
if [[ ${UPSTREAM} == 'current' ]]; then
  UPSTREAM=$(curl -L ${SOURCE}/packages/sandpaper/)
  UPSTREAM=$(echo ${UPSTREAM} | jq -r .[1].Version)
elif [[ ${SOURCE} == 'https://carpentries.r-universe.dev' ]]; then
  SOURCE=https://carpentries.github.io/drat
fi

# Create a temporary directory for the sandpaper resource files to land in
TMP=$(mktemp -d)

# Show the version inforamtion
echo "::group::Version Information"
echo "This version:    ${CURRENT}"
echo "Current version: ${UPSTREAM}"
echo "::endgroup::"

# Copy the contents if the versions do not match
if [[ ${CURRENT} != ${UPSTREAM} ]]; then
  if [[ ${CLEAN} ]]; then
    echo "::group::Cleaning all ${CLEAN} workflow files"
    if [[ $(grep '^\.' <<< ${CLEAN}) ]]; then
      rm -fv .github/workflows/*${CLEAN}
    else
      rm -fv .github/workflows/${CLEAN}
    fi

    echo "::endgroup::"
  fi
  echo "::group::Copying files"
  curl -L ${SOURCE}/src/contrib/sandpaper_${UPSTREAM}.tar.gz | \
    tar -C ${TMP} --wildcards -xzv sandpaper/inst/workflows/*
  cp -v ${TMP}/sandpaper/inst/workflows/* .github/workflows/
  echo "::endgroup::"
  NEEDS_UPDATE=$(git status --porcelain)
  if [[ ${NEEDS_UPDATE} ]]; then
    echo "old=$(echo ${CURRENT})" >> $GITHUB_OUTPUT
    echo "new=$(echo ${UPSTREAM})" >> $GITHUB_OUTPUT
    echo "date=$(date --utc -Iminutes)" >> $GITHUB_OUTPUT
    echo "Updating version number to ${UPSTREAM}"
    echo ${UPSTREAM} > .github/workflows/sandpaper-version.txt
  else
    echo "${CURRENT} contains the latest version of the workflow files."
  fi
  rm -r ${TMP}
else
  echo "Nothing to update!"
fi

