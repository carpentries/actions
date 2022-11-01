#!/usr/bin/env bash
set -eo pipefail
# Fetch and merge the updated styles from upstream
# 
# Note: you have to set environment variables for this to work.... it's kind of
# irritating
#
# usage: 
#   bash update-styles.sh [COMMIT]
#
# args:
#   [COMMIT] if 'true', a commit will be generated, otherwise it is ignored
#
# authors: Maxim Belkin
# contributor: Zhian N. Kamvar

COMMIT=${1:-}

echo "::group::Fetch Styles"
if [[ -n "${PR}" ]]
then
  ref="refs/pull/${PR}/head"
else
  ref="gh-pages"
fi

if [[ $(git config --global user.email) ]]
then
  echo ok > /dev/null
else
  git config --global user.email "team@carpentries.org"
fi

if [[ $(git config --global user.name) ]]
then
  echo ok > /dev/null
else
  git config --global user.name "Carpentries Bot"
fi

git remote add styles https://github.com/carpentries/styles.git
git fetch -n styles ${ref}:styles-ref
echo "::endgroup::"
echo "::group::Synchronize Styles"
# Sync up only if necessary
N=$(git rev-list --count HEAD..styles-ref)
if [[ ${N} != 0 ]]
then
  echo "There are ${N} changes upstream"
  # The merge command below might fail for lessons that use remote theme
  # https://github.com/carpentries/carpentries-theme
  echo "Testing merge using recursive strategy, accepting upstream changes without committing"
  if [[ ! $(git merge --allow-unrelated-histories -s recursive -Xtheirs --no-commit styles-ref) ]]
  then
    # Remove "deleted by us, unmerged" files from the staging area.
    # these are the files that were removed from the lesson
    # but are still present in the carpentries/styles repo
    echo "Removing previously deleted files"
    git rm $(git diff --name-only --diff-filter=DU) || echo "No files to remove"
    # If there are still "unmerged" files,
    # let's raise an error and look into this more closely
    if [[ -n $(git diff --name-only --diff-filter=U) ]]
    then
      echo "There were unmerged files in ${LESSON}:"
      echo "$(git diff --compact-summary --diff-filter=U)"
      git branch -D styles-ref
      git remote remove styles
      exit 1
    fi
  fi
  if [[ ${COMMIT} == 'true' ]]
  then
    echo "Adding merge commit"
    git commit -m "[actions] Sync lesson with carpentries/styles"
    git branch -D styles-ref
    git remote remove styles
  else
    echo "Creating squash commit later"
  fi
  echo "update=true" >> $GITHUB_OUTPUT
else
  echo "Up to date!"
  git branch -D styles-ref
  git remote remove styles
fi
echo "::endgroup::"
