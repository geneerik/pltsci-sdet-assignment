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
APPLICATION_HOME=/usr/local/demo-app
sudo mkdir -p "${APPLICATION_HOME}"/logs
sudo chmod 777 "${APPLICATION_HOME}"/logs
cd service
JAR_NAME=$(ls *.jar)
cd /usr/local/demo-app
sudo ln -sf "${WORKSPACE_DIR}"/service/"${JAR_NAME}"
sudo ln -sf "${WORKSPACE_DIR}"/application-logging.properties application.properties

cd "${TEST_DIR}"

npm install --include=dev
cd /usr/local/bin
sudo ln -sf "${TEST_DIR}"/node_modules/allure-commandline/dist/bin/allure
cd "${TEST_DIR}"
npx playwright install
npx codeceptjs def

# codeceptjs needs a special patch to allow a successful exit code when tests fail; applying the patch here
### in the eixt listener
#    if (failedTests.length) {
###
### needs to be changed to
#    if ((process.env.ALLOW_TEST_FAILURES ?? "false").toLocaleLowerCase() !== "true"  && failedTests.length) {
### and in the workers vlass isFailed method
#    return (this.stats.failures || this.errors.length) > 0;
### needs to be changed to
#    return ((process.env.ALLOW_TEST_FAILURES ?? "false").toLocaleLowerCase() !== "true"  && this.stats.failures > 0) || this.errors.length > 0;
# This patch allows this to be enabled on environmental variable ALLOW_TEST_FAILURES having a value of "true". There is presently no way to do this using normal config or parameters

sed -i "s/^\\( *\\)if (failedTests.length) {\$/\\1if ((process.env.ALLOW_TEST_FAILURES ?? \"false\").toLowerCase() !== \"true\" \\&\\& failedTests.length) {/" "${WORKSPACE_DIR}"'/src/test/javascript/sdet-assignment-service-codeceptsjs/node_modules/codeceptjs/lib/listener/exit.js' && \
	sed -i "s/\\( *\\)return (this.stats.failures || this.errors.length) > 0;\$/\\1return ((process.env.ALLOW_TEST_FAILURES ?? \"false\").toLowerCase() !== \"true\" \\&\\& this.stats.failures > 0) || this.errors.length > 0;/" "${WORKSPACE_DIR}"'/src/test/javascript/sdet-assignment-service-codeceptsjs/node_modules/codeceptjs/lib/workers.js'

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

sed -i "s/^\\( *io.listen(\\)\\(webSocketsPort\\)\\();\\.*\\)\$/  const iohttp = require('http').createServer().listen(\\2, '0.0.0.0');\\n\\1iohttp\\3/" "${WORKSPACE_DIR}"'/src/test/javascript/sdet-assignment-service-codeceptsjs/node_modules/@codeceptjs/ui/bin/codecept-ui.js' && \
	sed -i "s/^\\( *app.listen(applicationPort\\)\\();\\.*\\)\$/\\1, '0.0.0.0'\\2/" "${WORKSPACE_DIR}"'/src/test/javascript/sdet-assignment-service-codeceptsjs/node_modules/@codeceptjs/ui/bin/codecept-ui.js'
