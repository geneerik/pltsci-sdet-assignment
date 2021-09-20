#!/bin/bash

# basic script to easily serve the html report generated by the test

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
REPORT_DIR=${REPORT_DIR:-"${SCRIPT_DIR}/test_output/report"}

# Start a simple http server serving the report directory
echo "hosting from ${REPORT_DIR}"
exec docker run --rm -v "${REPORT_DIR}":/usr/share/nginx/html:ro -p 8000:80 nginx:alpine