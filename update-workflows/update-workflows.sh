#!/usr/bin/env bash
set -eo pipefail

# Download and update sandpaper workflow files from an upstream repository
#
# usage:
#   bash update-workflows.sh [UPSTREAM] [CLEAN]
#
# args:
#   UPSTREAM - a version number or branch name from which to fetch the workflows. By default,
#     this is fetched from the latest release tag from https://github.com/carpentries/workbench-workflows
#   CLEAN files to clean as a pattern. Example: .yaml will clean all the yaml
#     files, but will leave the yml files alone.
#
# Example 1: Use the main branch workflow versions, removing all existing .yaml files first
#
# bash update-workflows.sh main .yaml
#
# Example 2: Use a specific release workflow version, only updating files that differ
#
# bash update-workflows.sh 0.18.3
#
# Example 3: Get the latest release, only updating files that differ
#
# bash update-workflows.sh


# Fail if we aren't in a sandpaper repository
if [[ -r .github/workflows/workflows-version.txt || -r .github/workflows/sandpaper-version.txt ]]; then
  echo "" > /dev/null
else
  echo "::error::This is not a Carpentries Workbench lesson repository"
  exit 1
fi

WF_REPO="https://github.com/carpentries/workbench-workflows/archive/refs"
SOURCE=""
BODY=""

# Set variables needed
UPSTREAM="${1:-latest}"
CLEAN="${2:-}"

# Get the current version of the workflow files if it exists
if [[ -r .github/workflows/workflows-version.txt ]]; then
  CURRENT=$(cat .github/workflows/workflows-version.txt)
elif [[ -r .github/workflows/sandpaper-version.txt ]]; then
  CURRENT=$(cat .github/workflows/sandpaper-version.txt)
else
  echo "::warning::No workflow version file found. Assuming no workflow files are present."
  CURRENT=""
fi

# Show the version information
echo "::group::Inputs"
echo "Requested version: ${UPSTREAM}"
echo "Clean:             ${CLEAN}"
echo "::endgroup::"

if [[ ${UPSTREAM} == 'latest' ]]; then
  # resolve latest release
  INFO=$(curl -s https://api.github.com/repos/carpentries/workbench-workflows/releases/${UPSTREAM})
  UPSTREAM=$(echo ${INFO} | jq -r .tag_name)
  BODY=$(echo ${INFO} | jq -r .body)
  SOURCE="${WF_REPO}/tags/${UPSTREAM}.tar.gz"
elif [[ ${UPSTREAM} =~ [0-9]+\.[0-9]+\.[0-9]+ ]]; then
  # if input matches version number
  SOURCE="${WF_REPO}/tags/${UPSTREAM}.tar.gz"
else
  # assume branch name
  INFO=$(curl -s https://api.github.com/repos/carpentries/workbench-workflows/branches/${UPSTREAM})
  SHA=$(echo ${INFO} | jq -r .commit.sha)
  BODY=$(curl -s https://api.github.com/repos/carpentries/workbench-workflows/git/commits/${SHA} | jq -r .message)
  SOURCE="${WF_REPO}/heads/${UPSTREAM}.tar.gz"
fi

# Create a temporary directory for the sandpaper resource files to land in
TMP=$(mktemp -d)

# Show the version information
echo "::group::Version Information"
echo "Current version:   ${CURRENT}"
echo "Requested version: ${UPSTREAM}"
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
  curl -L ${SOURCE} | \
    tar -C ${TMP} --strip-components=1 --wildcards -xzv */workflows/*
  cp -v ${TMP}/workflows/* .github/workflows/
  echo "::endgroup::"
  NEEDS_UPDATE=$(git status --porcelain)
  if [[ ${NEEDS_UPDATE} ]]; then
    echo "old=$(echo ${CURRENT})" >> $GITHUB_OUTPUT
    echo "new=$(echo ${UPSTREAM})" >> $GITHUB_OUTPUT
    echo "date=$(date --utc -Iminutes)" >> $GITHUB_OUTPUT
    echo "body=$(echo ${BODY})" >> $GITHUB_OUTPUT
    echo "Updating version number to ${UPSTREAM}"
    echo ${UPSTREAM} > .github/workflows/workflows-version.txt

    # finally if .github/workflows/sandpaper-version.txt exists, delete it
    if [[ -e .github/workflows/sandpaper-version.txt ]]; then
      echo "Removing old sandpaper-version.txt ..."
      rm .github/workflows/sandpaper-version.txt
    fi
  else
    echo "${CURRENT} contains the latest version of the workflow files."
  fi
  rm -r ${TMP}
else
  echo "Nothing to update!"
fi
