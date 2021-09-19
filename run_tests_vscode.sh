#!/bin/bash

# This script will execute the tests against the a server it starts locally.
# all pre-requisites must by otherwise installed as this assumes it is running
# in a vscode devcontrainer known to have all the required tools already
# installed

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

# prepare test setup
./prepare_test_env.sh

# run tests
exec ./test_npx.sh codeceptjs run --plugins allure