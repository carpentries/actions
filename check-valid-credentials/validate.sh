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

TOKEN_NAME="Sandpaper%20Token%20%28${GITHUB_REPOSITORY}%29"
TOKEN_URL="https://github.com/settings/tokens/new?scopes=public_repo,workflow&description=${TOKEN_NAME}"

# Set up output first
echo "## 💡 Using Default GitHub Access Token" >> $GITHUB_STEP_SUMMARY
echo "" >> $GITHUB_STEP_SUMMARY
echo "This lesson is using the default access token supplied by GitHub (\`secrets.GITHUB_TOKEN\`)." >> $GITHUB_STEP_SUMMARY
echo "When using the Dockerised workflows released as part of {sandpaper} 0.20.0 or later, this will not affect the running of these workflows." >> $GITHUB_STEP_SUMMARY
echo "" >> $GITHUB_STEP_SUMMARY
echo "If you have recently created this repository or changed any repository settings, and are experiencing any problems with building your lesson:" >> $GITHUB_STEP_SUMMARY
echo "- please verify that you have checked the \`Allow GitHub Actions to create and approve pull requests\` checkbox in your [repository \`Workflow permissions\` settings](https://github.com/${GITHUB_REPOSITORY}/settings/actions)" >> $GITHUB_STEP_SUMMARY
echo "- please inform the Workbench developers of this by [raising an issue](https://github.com/carpentries/workbench/issues)" >> $GITHUB_STEP_SUMMARY
echo "" >> $GITHUB_STEP_SUMMARY
# echo "If you are still using the pre-0.20.0 workflows:" >> $GITHUB_STEP_SUMMARY
# echo "- RECOMMENDED: migrate to the new Dockerised workflows by following the instructions in the [Workbench documentation](https://carpentries.github.io/sandpaper-docs/update.html#updating-your-deployment-workflows)." >> $GITHUB_STEP_SUMMARY
# echo "- OR:" >> $GITHUB_STEP_SUMMARY
# echo "  1. :key: [generate a new Classic token](${TOKEN_URL}) called \`Sandpaper Token (${GITHUB_REPOSITORY})\` with the 'public_repo' and 'workflow' scopes from your GitHub Account" >> $GITHUB_STEP_SUMMARY
# echo "  2. :clipboard: Copy your new token to your clipboard" >> $GITHUB_STEP_SUMMARY
# echo "  3. Go To https://github.com/${GITHUB_REPOSITORY}/settings/secrets/actions/new" >> $GITHUB_STEP_SUMMARY
# echo "     - enter \`SANDPAPER_WORKFLOW\` for the 'Name'" >> $GITHUB_STEP_SUMMARY
# echo "     - :inbox_tray: paste your token for the 'Value'" >> $GITHUB_STEP_SUMMARY
# echo "" >> $GITHUB_STEP_SUMMARY

if [[ ${PAT} ]]
then

  headerfile=${TMP}/${RANDOM}
  curl --dump-header ${headerfile} --head -H "Authorization: token ${PAT}" \
    https://api.github.com/user > /dev/null

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
