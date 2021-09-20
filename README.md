Solution to Platform Science Software Development Engineer in Test assignment
==========================================

## Introduction
Response to initial inquiry [here](README-Request.md).

&nbsp;
### View the Test Report

[Report](https://geneerik.github.io/pltsci-sdet-assignment)

[Bugs](/issues)

[BDD Tests](src/test/javascript/sdet-assignment-service-codeceptsjs/features/)

&nbsp;
# How to Run the Tests

multiple ways

&nbsp;
## Using Pre-created Docker Images (fastest)

This repository has the images.  DL 1 script to do everything for you.

&nbsp;
### Prerequisites

1) A unix-like system from which to run the test start script.  This could be MacOS, Linux, or Windows with [WSL2](https://docs.microsoft.com/en-us/windows/wsl/install-win10) set up correctly.

2) `docker` and `docker-compose` .
   
   These commands need to be available on the shell and the user who is logged in will need to be able to run docker commands without sudo.
   
   For Windows you will need to install `Docker Desktop` with the [WSL 2 Backend](https://docs.docker.com/desktop/windows/install/#wsl-2-backend).
   
   For Mac, install `Docker Desktop` according to the instruction [here](https://docs.docker.com/desktop/mac/install/).

   For Linux, you will need to install docker according to the [instructions for your distro](https://docs.docker.com/engine/install/#server) AND make sure that the user you are running as is a member of the group which may access docker (usually `docker`).

   Regardless of the operating system under which the tests will be run, the docker service will need to be running.  For Windows and Mac, these generally means you will need to start `Docker Desktop`, after which it will stay running int he background and usually restart each time the system boots.  For Linux, there is usually a "service" that starts the docker server in the background.  Thee mechanism by which this works and whether or not it is triggered as part of the `docker` installation is distro dependent.  Please consult the [instructions for your distro](https://docs.docker.com/engine/install/#server) to ensure it is running. 

3) Access to the internet

4) The `curl` tool install.  `curl` is pre-installed on many unix-like systems, including on MacOS.  If it is not installed, it will need to be installed via the system's package manager or some other means.

### Steps to Run Tests

1) Download the [run_tests.sh](run_tests.sh).  The following command can be use to download AND start the tests.  It is the quickest way to do eveything in a single command.

```shell
curl -sL 'https://github.com/geneerik/pltsci-sdet-assignment/blob/main/run_tests.sh' | bash
```
### Alternative Steps to Run Tests

1) If the curl method was not desirable, download the [run_tests.sh](run_tests.sh) file using your browser.

2) On a command unix-like shell, navigate to wherever files are downloaded.  Most Operation systems will put those files in the `Downloads` directory in the user's home directory. The following command is usually enough to reach this location.

```shell
cd ~/Downloads
```

3) give the script executable permissions by issuing the following command:

```shell
chmod +x run_tests.sh
```

4) Run the script.  This will download the `docker-compose.yml` file, generate some pre-requisite file and structure, start the server and tests in containers, and on completion, start a web server hosting the generated html report.  This command should run the script.

```shell
./run_tests.sh
```
The test results will also be save in the `test_output` directory, including the report.

&nbsp;
## Build the images yourself

You can build it youself from the repo

&nbsp;
### Prerequisites

You will first need to satisfy the prerequisites for the [Pre-created Docker Images](#prerequisites) method.  In addition to those, you will need the following pre-requisites:

1) `git` .  This tool is used to capture the contents of this repository keeping many important extra bits of information intact.

&nbsp;
### Steps to Run Tests

TODO

&nbsp;
## Run with CodeceptJS-UI

TODO
```shell
(export USE_CODECEPTJS_UI=true; (curl -sL 'https://github.com/geneerik/pltsci-sdet-assignment/blob/main/run_tests.sh' | bash))
```

&nbsp;
## Run within VSCode

TODO