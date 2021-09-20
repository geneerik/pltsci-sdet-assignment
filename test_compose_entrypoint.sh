#!/bin/bash

# Entrypoint script for the e2e test container when running in docker-compose along side of the
# server under test.  This is used to correct some permissions on a shared directory and prevent
# a filesystem race condition.  It really only needs to be run once, so it could be done using an
# init container.

set -e
trap 'catch $? $LINENO' ERR
catch() {
  echo "Error $1 occurred on $2"
}
set -euo pipefail

SCRIPT_PATH=$0
REAL_SCRIPT_PATH=$(readlink -f ${SCRIPT_PATH})
SCRIPT_DIR=$(dirname ${REAL_SCRIPT_PATH}})

# need to start as UID 0, create the /usr/local/demo-app/logs dir,
mkdir -p /usr/local/demo-app/logs
# copy in the application-logging.properties file to /usr/local/demo-app/application.properties ,
cp /src/test/javascript/sdet-assignment-service-codeceptsjs/application-logging.properties /usr/local/demo-app/application.properties
# and set the permissions on the demo-app directory so the e2e tests can access it
chown -R www-data:www-data /usr/local/demo-app
chmod 775 /usr/local/demo-app
chmod 775 /usr/local/demo-app/logs

# then become the pwuser and transfer exec control to npx as this user
if [[ 'true' == "${CODECEPT_UI:-}" ]]; then
  exec su -s /bin/bash pwuser -c 'exec /start_codeceptjs_ui_server.sh '"$*"
else
  exec su -s /bin/bash pwuser -c 'exec /usr/bin/npx codeceptjs '"$*"
fi