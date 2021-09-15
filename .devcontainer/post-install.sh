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
WORKSPACE_DIR=$(cd "${SCRIPT_DIR}"/.. && pwd)
TEST_DIR="${WORKSPACE_DIR}"/src/test/javascript/sdet-assignment-service-codeceptsjs

ORIG_DIR=$(pwd)

echo '** installing project deps! **'
cd /
sudo ln -sf "${WORKSPACE_DIR}"/service/application.properties
sudo mkdir -p /javalogs
cd /usr/local/bin
sudo ln -sf "${TEST_DIR}"/node_modules
cd "${TEST_DIR}"

npm install --include=dev
cd /usr/local/bin
sudo ln -sf "${TEST_DIR}"/node_modules/allure-commandline/dist/bin/allure
cd "${TEST_DIR}"
npx playwright install
npx codeceptjs def