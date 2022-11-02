#!/usr/bin/env bash
set -eo pipefail

# Download and update sandpaper workflow files from an upstream repository
#
# usage: 
#   bash validate.sh GITHUB_PAT
#
# args:
#   GITHUB_PAT a github personal access token. This is only ever used for 
#   accessing the headers of the /user/ endpoint of the github API
#
# Fail if we aren't in a sandpaper repository

PAT=${1:-}

# Create a temporary directory for the sandpaper resource files to land in
if [[ -d ${TMPDIR} ]]; then
  TMP="${TMPDIR}/sandpaper-${RANDOM}"
elif [[ -d /tmp/ ]]; then
  TMP="/tmp/sandpaper-${RANDOM}"
else
  TMP="../sandpaper-${RANDOM}"
fi
mkdir -p ${TMP}

# Set up output first because there
TOKEN_NAME="Sandpaper%20Token%20%28${GITHUB_REPOSITORY}%29"
TOKEN_URL="https://github.com/settings/tokens/new?scopes=public_repo,workflow&description=${TOKEN_NAME}"
echo "## :warning: Missing Token" >> $GITHUB_STEP_SUMMARY
echo "" >> $GITHUB_STEP_SUMMARY
echo "The \`SANDPAPER_WORKFLOW\` secret is missing, invalid, or does not" \
  "have the right scope (public_repo, workflow) to update the package cache." >> $GITHUB_STEP_SUMMARY
echo "" >> $GITHUB_STEP_SUMMARY
echo "If you want to have automated pull request updates to your package cache," \
"you will need to generate a new token." >> $GITHUB_STEP_SUMMARY
echo "" >> $GITHUB_STEP_SUMMARY
echo "### Steps to Generate a New Token" >> $GITHUB_STEP_SUMMARY
echo "" >> $GITHUB_STEP_SUMMARY
echo "1. :key: [Click here to generate a new token](${TOKEN_URL}) called \`Sandpaper Token (${GITHUB_REPOSITORY})\` with the "public_repo" and "workflow" scopes from your GitHub Account" >> $GITHUB_STEP_SUMMARY
echo "2. :clipboard: Copy your new token to your clipboard" >> $GITHUB_STEP_SUMMARY
echo "3. Go To https://github.com/${GITHUB_REPOSITORY}/settings/secrets/actions/new" >> $GITHUB_STEP_SUMMARY
echo "   - enter \`SANDPAPER_WORKFLOW\` for the 'Name'" >> $GITHUB_STEP_SUMMARY
echo "   - :inbox_tray: paste your token for the 'Value'" >> $GITHUB_STEP_SUMMARY

if [[ ${PAT} ]]
then

  headerfile=${TMP}/${RANDOM}
  curl --dump-header ${headerfile} --head -H "Authorization: token ${PAT}" \
    https://api.github.com/user/ > /dev/null

  WORKFLOW=$(grep -ic 'x-oauth-scopes: .*workflow' ${headerfile} || echo '0')
  REPO=$(grep -ic 'x-oauth-scopes: .*repo' ${headerfile} || echo '0')
  rm -r ${TMP}

  if [[ ${WORKFLOW} == 1 ]]
  then
    echo "wf=true" >> $GITHUB_OUTPUT
    rm -f $GITHUB_STEP_SUMMARY
  fi

  if [[ ${REPO} == 1 ]]
  then
    echo "repo=true" >> $GITHUB_OUTPUT
    rm -f $GITHUB_STEP_SUMMARY
  fi

else
  echo "Nothing to do!"
fi
