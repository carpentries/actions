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
  UPSTREAM=$(curl ${SOURCE}/packages/sandpaper/)
  UPSTREAM=$(echo ${UPSTREAM} | grep '[.]' | sed -E -e 's/[^0-9.]//g')
elif [[ ${SOURCE} == 'https://carpentries.r-universe.dev' ]]; then
  SOURCE=https://carpentries.github.io/drat
fi

# Create a temporary directory for the sandpaper resource files to land in
if [[ -d ${TMPDIR} ]]; then
  TMP="${TMPDIR}/sandpaper-${RANDOM}"
elif [[ -d /tmp/ ]]; then
  TMP="/tmp/sandpaper-${RANDOM}"
else
  TMP="../sandpaper-${RANDOM}"
fi
mkdir -p ${TMP}

# Show the version inforamtion
echo "::group::Version Information"
echo "This version:    ${CURRENT}"
echo "Current version: ${UPSTREAM}"
echo "::endgroup::"

# Copy the contents if the versions do not match
if [[ ${CURRENT} != ${UPSTREAM} ]]; then
  if [[ ${CLEAN} ]]; then
    echo "::group::Cleaning all ${CLEAN} workflow files"
    rm -fv .github/workflows/${CLEAN}
    echo "::endgroup::"
  fi
  echo "::group::Copying files"
  curl ${SOURCE}/src/contrib/sandpaper_${UPSTREAM}.tar.gz | \
    tar -C ${TMP} --wildcards -xzv sandpaper/inst/workflows/*
  cp -v ${TMP}/sandpaper/inst/workflows/* .github/workflows/
  echo "::endgroup::"
  NEEDS_UPDATE=$(git status --porcelain)
  if [[ ${NEEDS_UPDATE} ]]; then
    echo "::set-output name=old::$(echo ${CURRENT})"
    echo "::set-output name=new::$(echo ${UPSTREAM})"
    echo "Updating version number to ${UPSTREAM}"
    echo ${UPSTREAM} > .github/workflows/sandpaper-version.txt
  else
    echo "${CURRENT} contains the latest version of the workflow files."
  fi
  rm -r ${TMP}
else
  echo "Nothing to update!"
fi

