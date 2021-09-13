#!/bin/bash
set -e
trap 'catch $? $LINENO' ERR
catch() {
  echo "Error $1 occurred on $2"
}
set -euo pipefail

SCRIPT_PATH=$0
REAL_SCRIPT_PATH=$(readlink -f ${SCRIPT_PATH})
SCRIPT_DIR=$(dirname ${REAL_SCRIPT_PATH}})
cd "${SCRIPT_DIR}"

TEST_DIR="${SCRIPT_DIR}"/src/test/javascript/sdet-assignment-service-codeceptsjs

# clean report
rm -rf allure-report

# generate report and fix issue links
export ALLURE_OPTS="-Dallure.link.mylink.pattern=https://example.org/mylink/{} -Dallure.link.issue.pattern=https://example.org/issue/{} -Dallure.link.tms.pattern=https://example.org/tms/{} -Dallure.issues.tracker.pattern=https://github.com/geneerik/pltsci-sdet-assignment-unittests/issue/%s"
allure generate "${TEST_DIR}"/output