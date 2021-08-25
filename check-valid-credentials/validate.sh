#!/usr/bin/env bash
set -eo pipefail
set -o xtrace

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
  cat ${headerfile}
  WORKFLOW=$(grep -ic 'x-accepted-oauth-scopes: .*workflow' ${headerfile} || echo '0')
  REPO=$(grep -ic 'x-accepted-oauth-scopes: .*repo' ${headerfile} || echo '0')
  rm -r ${TMP}

  if [[ ${WORKFLOW} == 1 ]]
  then
    echo "::set-output name=wf::true"
  fi

  if [[ ${REPO} == 1 ]]
  then
    echo "::set-output name=repo::true"
  fi

else
  echo "Nothing to do!"
fi
