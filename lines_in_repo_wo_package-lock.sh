#!/bin/bash

# vanity script to show the number of lines in the SCM repo minus the packag-lock.json file as
# this is generated and massive

set -e
trap 'catch $? $LINENO' ERR
catch() {
  echo "Error $1 occurred on $2" >&2
}
set -euo pipefail

SCRIPT_PATH=$0
REAL_SCRIPT_PATH=$(readlink -f ${SCRIPT_PATH})
SCRIPT_DIR=$(dirname ${REAL_SCRIPT_PATH}})
cd "${SCRIPT_DIR}"

# get the number of lines in the geneerik/pltsci-sdet-assignment repo and subtract the size of package-log.json
REPO_LINES=$(nodejs lines_in_repo.js)
PACKAGE_LOCK_LINES=$(wc -l src/test/javascript/sdet-assignment-service-codeceptsjs/package-lock.json|awk '{ print $1; }')
echo $(( ${REPO_LINES} - ${PACKAGE_LOCK_LINES} ))