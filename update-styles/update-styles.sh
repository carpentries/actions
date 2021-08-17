#!/usr/bin/env bash
set -eo pipefail

# Fetch and merge the updated styles from upstream
#
# usage: 
#   bash update-styles.sh [PR] [LESSON]
#
# args:
#   PR the pull request number
#   LESSON the name of the lesson
#
# authors: Maxim Belkin
# contributor: Zhian N. Kamvar


PR=${1:-}
LESSON=${2:-}

echo "::group::Fetch Styles"
if [[ -n "${PR}" ]]
then
  ref="refs/pull/${PR}/head"
else
  ref="gh-pages"
fi

git config --local user.email "team@carpentries.org"
git config --local user.name "The Carpentries Bot"
git remote add styles https://github.com/carpentries/styles.git
git fetch styles ${ref}:styles-ref
echo "::endgroup::"
echo "::group::Synchronize Styles"
# Sync up only if necessary
if [[ $(git rev-list --count HEAD..styles-ref) != 0 ]]
then
  # The merge command below might fail for lessons that use remote theme
  # https://github.com/carpentries/carpentries-theme
  echo "Testing merge using recursive strategy, accepting upstream changes without committing"
  if [[ ! $(git merge -s recursive -Xtheirs --no-commit styles-ref) ]]
  then
    # Remove "deleted by us, unmerged" files from the staging area.
    # these are the files that were removed from the lesson
    # but are still present in the carpentries/styles repo
    echo "Removing previously deleted files"
    git rm $(git diff --name-only --diff-filter=DU)
    # If there are still "unmerged" files,
    # let's raise an error and look into this more closely
    if [[ -n $(git diff --name-only --diff-filter=U) ]]
    then
      echo "There were unmerged files in ${LESSON}:"
      echo "$(git diff --compact-summary --diff-filter=U)"
      exit 1
    fi
  fi
fi
echo "::endgroup::"
