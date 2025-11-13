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

# # Set up output first because there
echo "## 💡 Using Default GitHub Access Token" >> $GITHUB_STEP_SUMMARY
echo "" >> $GITHUB_STEP_SUMMARY
echo "This lesson is using the default access token supplied by GitHub (\`secrets.GITHUB_TOKEN\`)." >> $GITHUB_STEP_SUMMARY
echo "This should not affect the running of these workflows." >> $GITHUB_STEP_SUMMARY
echo "" >> $GITHUB_STEP_SUMMARY
echo "However, if you've recently created this repository or changed any repository settings, and are experiencing any problems with building your lesson:" >> $GITHUB_STEP_SUMMARY
echo "- please verify that you have checked the \`Allow GitHub Actions to create and approve pull requests\` checkbox in your [repository \`Workflow permissions\` settings](https://github.com/${GITHUB_REPOSITORY}/settings/actions)" >> $GITHUB_STEP_SUMMARY
echo "- please inform the Workbench developers of this by [raising an issue](https://github.com/carpentries/workbench/issues)" >> $GITHUB_STEP_SUMMARY
echo "" >> $GITHUB_STEP_SUMMARY

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
