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

# need to start as UID 0, create the /usr/local/demo-app/logs dir,
mkdir /usr/local/demo-app/logs
# copy in the application-logging.properties file to /usr/local/demo-app/application.properties ,
cp /src/test/javascript/sdet-assignment-service-codeceptsjs/application-logging.properties /usr/local/demo-app/application.properties
# and 
chown -R www-data:www-data /usr/local/demo-app
chmod 775 /usr/local/demo-app
chmod 775 /usr/local/demo-app/logs

# then become the pwuser and transfer exec control to npx as this user
exec su -s /bin/bash pwuser -c 'exec /usr/bin/npx codeceptjs '"$*"