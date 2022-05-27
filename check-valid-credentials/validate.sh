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
    echo "::set-output name=wf::true"
  else
    echo "The \`SANDPAPER_WORKFLOW\` secret is missing, invalid," >> $GITHUB_STEP_SUMMARY
    echo "or does not have the right scope to update the package cache." >> $GITHUB_STEP_SUMMARY
    echo "If you want to have automated pull request updates to your package cache," >> $GITHUB_STEP_SUMMARY
    echo "you will need to generate a new token by visiting " >> $GITHUB_STEP_SUMMARY
    echo "https://github.com/settings/tokens/new?scopes=repo,workflow&description=Sandpaper%%20Token%%20%%28${{ github.repository }}%%29\n" >> $GITHUB_STEP_SUMMARY
    echo "Once you have created the token, copy it to your clipboard and go to" >> $GITHUB_STEP_SUMMARY
    echo "https://github.com/${{ github.repository }}/settings/secrets/actions/new" >> $GITHUB_STEP_SUMMARY
    echo "and enter SANDPAPER_WORKFLOW for the 'Name' and paste your key for the 'Value'." >> $GITHUB_STEP_SUMMARY
  fi

  if [[ ${REPO} == 1 ]]
  then
    echo "::set-output name=repo::true"
  fi

else
  echo "Nothing to do!"
fi
