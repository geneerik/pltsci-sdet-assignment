#!/bin/bash
set -e
trap 'catch $? $LINENO' ERR
catch() {
  echo "Error $1 occurred on $2" >&2
}
set -euo pipefail

SCRIPT_PATH=$0
REAL_SCRIPT_PATH=$(readlink -f ${SCRIPT_PATH})
SCRIPT_DIR=$(dirname ${REAL_SCRIPT_PATH}})
cd "${SCRIPT_DIR}"

TEST_DIR="${SCRIPT_DIR}"/src/test/javascript/sdet-assignment-service-codeceptsjs

# build the .env file
if [[ 'true' != "${SKIP_ENV_FILE:-}" ]]; then
  echo "REGISTRY_URI=ghcr.io/
DOCKER_NAMESPACE=geneerik/
PWD=${SCRIPT_DIR}
IMAGE_VERSION=${IMAGE_VERSION:-}" > .env
fi

docker-compose down -v || true

# try to pull the assocaite docker images from the remote repo; will build otherwise
if [[ 'true' != "${SKIP_PULL:-}" ]]; then
  docker-compose pull || true
fi

# docker-compose up will build any needed images
docker-compose up &
DOCKER_COMPOSE_PID=$!

# If this script is killed, down the containers and kill docker-compose if needed
trap 'catch $? $LINENO && ( (kill -s SIGTERM '"${DOCKER_COMPOSE_PID}"' 2> /dev/null) && sleep 5 || true) && (docker-compose down -v || true)' ERR

# While docker-compose is running...
DOCKER_COMPOSE_PID_ALIVE=$( (kill -0 "${DOCKER_COMPOSE_PID}" && echo "true") || echo "false" )
LOOP_COUNT=0
MAX_START_TIMEOUT_SECONDS=${MAX_START_TIMEOUT_SECONDS:-10}
while [[ 'true' == "${DOCKER_COMPOSE_PID_ALIVE}" ]]; do
    # check if the container exists yet
    ( (2>&1 docker inspect --type container pltsci-sdet-assignment-tests > /dev/null) && echo '** test container creation detected') && break || true
    echo '** STILL WAITING FOR test container creation'
    sleep 1
    DOCKER_COMPOSE_PID_ALIVE=$( (kill -0 "${DOCKER_COMPOSE_PID}" && echo "true") || echo "false" )
    LOOP_COUNT=$(("${LOOP_COUNT}" + 1))

    # Lets not wait forever; trigger failure after max loop count (rough timeout guess)
    if [[ "${LOOP_COUNT}" -gt "${MAX_START_TIMEOUT_SECONDS}" ]]; then
      echo "TIMEOUT waiting for test container to start" >&2 && false
    fi
done

docker wait pltsci-sdet-assignment-tests
( (kill -s SIGTERM '"${DOCKER_COMPOSE_PID}"' 2> /dev/null) && sleep 5 || true) && (docker-compose down -v)