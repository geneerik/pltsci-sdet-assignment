#!/bin/bash

# 

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
TEST_OUTPUT_DIR=${TEST_OUTPUT_DIR:-"$(pwd)"/test_output}
XUNIT_OUTPUT_DIR=${XUNIT_OUTPUT_DIR:-"${TEST_OUTPUT_DIR}/output"}
REPORT_OUTPUT_DIR=${REPORT_OUTPUT_DIR:-"${TEST_OUTPUT_DIR}/report"}

# clean report
rm -rf "${REPORT_OUTPUT_DIR}"/*

# generate report and fix issue links
ISSUE_TRACKER_PATTERN=${ISSUE_TRACKER_PATTERN:-'https://github.com/geneerik/pltsci-sdet-assignment/issues/%s'}
export ALLURE_OPTS=${ALLURE_OPTS:-"-Dallure.link.mylink.pattern=https://example.org/mylink/{} -Dallure.link.issue.pattern=https://example.org/issue/{} -Dallure.link.tms.pattern=https://example.org/tms/{} -Dallure.issues.tracker.pattern=${ISSUE_TRACKER_PATTERN}"}

if [[ 'true' == "${ALLURE_SERVE:-}" ]]; then
  exec "${TEST_DIR}"/node_modules/allure-commandline/dist/bin/allure serve --report-dir "${REPORT_OUTPUT_DIR}" "${XUNIT_OUTPUT_DIR}"
else
  exec "${TEST_DIR}"/node_modules/allure-commandline/dist/bin/allure generate --report-dir "${REPORT_OUTPUT_DIR}" "${XUNIT_OUTPUT_DIR}"
fi