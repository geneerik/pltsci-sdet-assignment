#!/bin/bash

# ??

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

./test_npm.sh install --include=dev

# clean test setup
if [[ 'false' != "${CLEAN_TEST_OUTPUT:-}" ]]; then
    rm -rf "${TEST_DIR}"/test_output/*
fi