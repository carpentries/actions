set -xeuo pipefail

NR=${1:?"Pull request number required"}
repo=${2:?"repository required"}

URI="https://api.github.com/repos/${repo}/pulls/${NR}"
ACCEPT="Accept:application/vnd.github.v3+json"


MERGE_STAT=$(curl -sIH "${ACCEPT}" "${URI}/merge")
FILES=$(curl -sH "${ACCEPT}" "${URI}/files")

NO_FILES=$(grep -c "\"message\": \"Not Found\"" <<< ${FILES})
GH_FILES=$(grep -c "\"filename\": \".github" <<< ${FILES})
MERGED=$(grep -c "status: 202" <<< ${MERGED_STAT})

if [ ${NO_FILES} -ne 0 ] || [ ${GH_FILES} -ne 0 ] || [ ${MERGED} -ne 0 ]; then
  echo "Invalid PR Number (${NR}):\n"
  if [ ${NO_FILES} -ne 0 ]; then echo "No files in the PR"; fi
  if [ ${GH_FILES} -ne 0 ]; then echo "workflow files in the PR:\n${GH_FILES}"; fi
  if [ ${MERGED}   -ne 0 ]; then echo "PR already merged"; fi
  valid=false
else
  valid=true
fi

echo "::set-output name=VALID::${valid}"

echo "done"
