#!/bin/bash
set -e
trap 'catch $? $LINENO' ERR
catch() {
  echo "Error $1 occurred on $2" >&2
}
set -euo pipefail

SCRIPT_PATH=$0

if [[ "$OSTYPE" == "darwin"* ]]; then
  # MacOS equivalent of readlink -f

  cd $(dirname "${SCRIPT_PATH}")
  SCRIPT_BASE_NAME=$(basename "${SCRIPT_PATH}")

  # Iterate down a (possible) chain of symlinks
  CUR_TARGET=${SCRIPT_BASE_NAME}
  while [ -L "${SCRIPT_BASE_NAME}" ]
  do
      CUR_TARGET=$(readlink "${CUR_TARGET}")
      cd $(dirname "${CUR_TARGET}")
      CUR_TARGET=$(basename "${CUR_TARGET}")
  done

  # Compute the canonicalized name by finding the physical path 
  # for the directory we're in and appending the target file.
  SCRIPT_DIR=$(pwd -P)
  REAL_SCRIPT_PATH="${SCRIPT_DIR}/${CUR_TARGET}"
else
  REAL_SCRIPT_PATH=$(readlink -f "${SCRIPT_PATH}")
  SCRIPT_DIR=$(dirname "${REAL_SCRIPT_PATH}")
fi

cd "${SCRIPT_DIR}"

if [[ 'true' == "${USE_CODECEPTJS_UI:-}" ]]; then
  if [[ ! -e 'docker-compose.ui.yml' ]]; then
    curl -fL 'https://raw.githubusercontent.com/geneerik/pltsci-sdet-assignment/main/docker-compose.ui.yml' -O
  fi
  COMPOSE_FILE_PATH="${SCRIPT_DIR}"/docker-compose.ui.yml
else
  if [[ ! -e 'docker-compose.yml' ]]; then
    curl -fL 'https://raw.githubusercontent.com/geneerik/pltsci-sdet-assignment/main/docker-compose.yml' -O
  fi
  COMPOSE_FILE_PATH="${SCRIPT_DIR}"/docker-compose.yml
fi

# build the .env file
if [[ 'true' != "${SKIP_ENV_FILE:-}" ]]; then
  echo "REGISTRY_URI=ghcr.io/
DOCKER_NAMESPACE=geneerik/
PWD=${SCRIPT_DIR}
IMAGE_VERSION=${IMAGE_VERSION:-}" > .env

  echo "generated .env file >>>"
  cat .env && echo "<<<"
fi

# create test output dir if it doesnt already exist
mkdir -p "${SCRIPT_DIR}/test_output/report"
# set permissive permissions to write to test directory since it is likely being used
# by a different user than created it (inside the container)
chmod 777 "${SCRIPT_DIR}/test_output"
chmod 777 "${SCRIPT_DIR}/test_output/report"

# try to pull the associated docker images from the remote repo; will build otherwise
if [[ 'true' != "${SKIP_PULL:-}" ]]; then
  echo "** trying to pull"
  docker-compose -f "${COMPOSE_FILE_PATH}" pull || true
  echo "** done trying to pull"
fi

echo "docker-compose rendered from vars >>>"
docker-compose -f "${COMPOSE_FILE_PATH}" config && echo "<<<"

echo "Taking down any existing containers and volumes for this project"
docker-compose -f "${COMPOSE_FILE_PATH}" down -v || true

if [[ 'true' == "${USE_CODECEPTJS_UI:-}" ]]; then
  # docker-compose up will build any needed images
  docker-compose -f "${COMPOSE_FILE_PATH}" up || true

  # Capture the eixt code of the test container
  TEST_CONTAINER_EXIT_CODE=$(docker wait pltsci-sdet-assignment-tests || true)

  # Shut down and remove the remaing containers and any volumes not marked external
  docker-compose -f "${COMPOSE_FILE_PATH}" down -v || true

  # Exit with the same exit code as the test container; this allows
  # success or failure of test execution to be tracked by the caller
  # but should NOT be non-zero if all tests did not pass.  This should
  # only indicate test execution failure.  Build failure base on test
  # results can be more subjective and different metrics should be used
  if [[ "0" != "${TEST_CONTAINER_EXIT_CODE:-}" ]]; then
    exit "${TEST_CONTAINER_EXIT_CODE:-1}"
  fi

  # exec true allows script shutdown without using exit
  exec true
fi

# docker-compose up will build any needed images
docker-compose -f "${COMPOSE_FILE_PATH}" up &
DOCKER_COMPOSE_PID=$!

# If this script is killed, down the containers and kill docker-compose if needed
trap 'catch $? $LINENO && ( (kill -s SIGTERM '"${DOCKER_COMPOSE_PID}"' 2> /dev/null) && sleep 5 || true) && (docker-compose -f "${COMPOSE_FILE_PATH}" down -v || true)' ERR

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

# Wait for the test container to complete execution and capture its exit code
TEST_CONTAINER_EXIT_CODE=$(docker wait pltsci-sdet-assignment-tests)

# Shut down and remove the remaing containers and any volumes not marked external
( (kill -s SIGTERM '"${DOCKER_COMPOSE_PID}"' 2> /dev/null) && sleep 5 || true) && (docker-compose -f "${COMPOSE_FILE_PATH}" down -v)

# Exit with the same exit code as the test container; this allows
# success or failure of test execution to be tracked by the caller
# but should NOT be non-zero if all tests did not pass.  This should
# only indicate test execution failure.  Build failure base on test
# results can be more subjective and different metrics should be used
if [[ "0" != "${TEST_CONTAINER_EXIT_CODE}" ]]; then
  exit "${TEST_CONTAINER_EXIT_CODE}"
fi

# Serve the generate html reports using a basic server unless otherwise specified
if [[ "true" != "${SKIP_SERVE_REPORT:-}" ]]; then
  REPORT_HTTP_PORT=${REPORT_HTTP_PORT:-8000}
  echo "** Starting a simple server to host the generate test report at http://localhost:${REPORT_HTTP_PORT}"
  # we could also do this with the allure serve command
  exec docker run --rm -v "${SCRIPT_DIR}"/test_output/report:/usr/share/nginx/html:ro -p "${REPORT_HTTP_PORT}":80 nginx:alpine
fi