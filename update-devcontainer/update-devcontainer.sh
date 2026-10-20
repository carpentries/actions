#!/usr/bin/env bash
set -eo pipefail

# Check and update the image name used for the devcontainer, if it exists
#
# usage:
#   bash update-devcontainer.sh [REPO] [VERSION]
#
# args:
#   REPO - the name of the current repository, e.g. datacarpentry/R-ecology-lesson
#   VERSION - the version of the devcontainer image to use. 'latest' for latest release, a specific version tag (e.g. '0.0.1'), or a branch name (e.g. 'main').
#
# Example 1: Update the devcontainer image to the latest version
#
# bash update-devcontainer.sh datacarpentry/R-ecology-lesson latest
#
# Example 2: Use a specific release of the devcontainer image
#
# bash update-devcontainer.sh datacarpentry/R-ecology-lesson 0.0.1
#
# Example 3: Get the latest release of the devcontainer image
#
# bash update-devcontainer.sh datacarpentry/R-ecology-lesson


# Fail if we aren't in a sandpaper repository
# if [[ -r .github/workflows/workflows-version.txt || -r .github/workflows/sandpaper-version.txt ]]; then
#   echo "" > /dev/null
# else
#   echo "::error::This is not a Carpentries Workbench lesson repository"
#   exit 1
# fi

DC_REPO="https://github.com/carpentries/workbench-devcontainer/archive/refs"
SOURCE=""
BODY=""

# Set variables needed
REPO="${1:-}"

# Get the current version of the workflow files if it exists
CURRENT=""
if [[ -r .devcontainer/Dockerfile ]]; then
  # set CURRENT to the current FROM line in the Dockerfile
  CURRENT=$(grep -E '^FROM ' .devcontainer/Dockerfile | cut -d' ' -f2)
fi

GHTOKEN_HEADER=""
if [[ ${GITHUB_TOKEN} ]]; then
  echo "::notice::Using provided GITHUB_TOKEN for API requests."
  GHTOKEN_HEADER="Authorization: Bearer ${GITHUB_TOKEN}"
else
  echo "::notice::No GITHUB_TOKEN provided. API requests may be rate limited."
fi

# resolve latest release
INFO=$(curl -s -H "Accept: application/json" -H "${GHTOKEN_HEADER}" "https://api.github.com/repos/carpentries/workbench-devcontainer/releases/latest")
UPSTREAM=$(echo "${INFO}" | jq -r .tag_name)
if [[ ${UPSTREAM} == "null" ]]; then
  ERROR_CODE=$(echo "${INFO}" | jq -r .status)
  ERROR_MESSAGE=$(echo "${INFO}" | jq -r .message)
  echo "::error::Unable to resolve latest release tag from GitHub API."
  echo "::error::Unable to resolve latest release tag from GitHub API." >> $GITHUB_STEP_SUMMARY
  echo "" >> $GITHUB_STEP_SUMMARY
  echo "Status: ${ERROR_CODE}" >> $GITHUB_STEP_SUMMARY
  echo "Message: ${ERROR_MESSAGE}" >> $GITHUB_STEP_SUMMARY
  echo "" >> $GITHUB_STEP_SUMMARY
  echo "Please re-run this workflow!" >> $GITHUB_STEP_SUMMARY
  exit 1
fi
BODY=$(echo "${INFO}" | jq -r .body)
SOURCE="${DC_REPO}/tags/${UPSTREAM}.tar.gz"

# Create a temporary directory for the devcontainer resource files to land in
TMP=$(mktemp -d)

# Show the version information
echo "::group::Version Information"
echo "Current version:   ${CURRENT}"
echo "Requested version: ${UPSTREAM}"
echo "::endgroup::"

# Copy the contents if there is no .devcontainer directory
if [[ ! -d ".devcontainer" || "${CURRENT}" == "" ]]; then
  echo "::group::Copying devcontainer files"
  curl -L ${SOURCE} | \
    tar -C ${TMP} --strip-components=1 --wildcards -xzv */.devcontainer/*
  cp -R -v ${TMP}/.devcontainer .devcontainer
  echo "::endgroup::"
fi

rm -r ${TMP}

# if there is a <repo>-deps dependency image in the GHCR package registry, use it
REPO_NAME=""
REPO_PACKAGE=""
REPO_IMAGE_EXISTS=false

if [[ -n "${REPO}" && "${REPO}" == */* ]]; then
  REPO="${REPO,,}"
  REPO_OWNER="${REPO%%/*}"
  REPO_NAME="${REPO##*/}"
  REPO_PACKAGE="${REPO_NAME%-deps}-deps"
  REPO_PACKAGE_REF="ghcr.io/${REPO_OWNER}/${REPO_PACKAGE}"

  echo "::group::Repository dependency image check"
  if curl -fsSL -H "Accept: application/vnd.github+json" -H "${GHTOKEN_HEADER}" "https://api.github.com/orgs/${REPO_OWNER}/packages/container/${REPO_PACKAGE}" >/dev/null 2>&1; then
    REPO_IMAGE_EXISTS=true
    echo "Repository-scoped dependency image found: ${REPO_PACKAGE_REF}"
  elif curl -fsSL -H "Accept: application/vnd.github+json" -H "${GHTOKEN_HEADER}" "https://api.github.com/users/${REPO_OWNER}/packages/container/${REPO_PACKAGE}" >/dev/null 2>&1; then
    REPO_IMAGE_EXISTS=true
    echo "Repository-scoped dependency image found: ${REPO_PACKAGE_REF}"
  else
    echo "No repository-scoped dependency image found for ${REPO_PACKAGE_REF}"
  fi
  echo "::endgroup::"

  if [[ -f .devcontainer/Dockerfile ]]; then
    if [[ "${REPO_IMAGE_EXISTS}" == "true" && "${CURRENT}" != "${REPO_PACKAGE_REF}" ]]; then
      if grep -Eq '^FROM ' .devcontainer/Dockerfile; then
        sed -i -E "s#^FROM .*#FROM ${REPO_PACKAGE_REF}:latest#" .devcontainer/Dockerfile
        echo "Updated .devcontainer/Dockerfile to use ${REPO_PACKAGE_REF}:latest"
        echo "repo-package-ref=${REPO_PACKAGE_REF}:latest" >> $GITHUB_OUTPUT
        echo "date=$(date --utc -Iminutes)" >> $GITHUB_OUTPUT
      fi
    else
      if [[ "${CURRENT}" == "" ]]; then
        echo "Installed new .devcontainer/Dockerfile to use ghcr.io/carpentries/workbench-docker:latest"
        echo "repo-package-ref=ghcr.io/carpentries/workbench-docker:latest" >> $GITHUB_OUTPUT
        echo "date=$(date --utc -Iminutes)" >> $GITHUB_OUTPUT
      fi
    fi
  fi
fi
