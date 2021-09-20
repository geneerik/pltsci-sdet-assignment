#!/bin/bash

# Start the codeceptjs-ui server

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

# codeceptjs-ui needs a special patch to be served within docker; applying the patch here
###
#  io.listen(webSocketsPort);
#  app.listen(applicationPort);
###
### needs to be changed to
#  const iohttp = require('http').createServer().listen(webSocketsPort, '0.0.0.0');
#  io.listen(iohttp);
#  app.listen(applicationPort, '0.0.0.0');
# There is presently no way to do this using normal config or parameters

sed -i "s/^\\( *io.listen(\\)\\(webSocketsPort\\)\\();\\.*\\)\$/  const iohttp = require('http').createServer().listen(\\2, '0.0.0.0');\\n\\1iohttp\\3/" "${TEST_DIR}"'/node_modules/@codeceptjs/ui/bin/codecept-ui.js'
sed -i "s/^\\( *app.listen(applicationPort\\)\\();\\.*\\)\$/\\1, '0.0.0.0'\\2/" "${TEST_DIR}"'/node_modules/@codeceptjs/ui/bin/codecept-ui.js'

#actually start the server
exec ./test_npx.sh codecept-ui --plugins allure "$@"