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

JAR_ROOT="${SCRIPT_DIR}"/service

export APPLICATION_HOME=/usr/local/demo-app
export APPLICATION_FILE="${APPLICATION_HOME}"/sdet-assignment-service-0.0.1-SNAPSHOT.jar
cd ${APPLICATION_HOME}
exec "${JAR_ROOT}/run.sh"