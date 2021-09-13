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

ORIG_DIR=$(pwd)

echo '** installing project deps! **'
cd /
sudo ln -sf /workspaces/pltsci-sdet-assignment/service/application.properties
cd "${ORIG_DIR}"/src/test/javascript/sdet-assignment-service-codeceptsjs

npm install --dev
npx playwright install
npx codeceptjs def