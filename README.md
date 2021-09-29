Solution to Platform Science Software Development Engineer in Test assignment
==========================================

## Introduction
This repository is a response to demonstrate how to use Gherkin BDD via [CodeceptJS](https://codecept.io/) to perform REST API testing against a Spring based Java web app. It provides a clear set of instructions and supplies the necessary components to provide easily reproducibnle results.  Please find the initial inquiry [here](README-Request.md).  The requests are enumerated and ellaborated upon below, along with information on how this repository answers said inquiry.

### Requested features
* Implemented using any BDD framework (e.g. Cucumber or [Codecept.js](https://codecept.io/bdd/#gherkin))
  
  Response:
  * This repository implements the tests that it executed using CodeceptJS with BDD extensions.
* Must run on Mac OS X or Linux (x86-64)
  
  Response:
  * This repository extensively targets the use of Docker to container the "moving parts" aspects of the test execution process and, as such, is cross-platform to any operating system capable of using Docker.  This included Windows, Linux, and Mac OS.
* The full source code, including any code written which is not part of the normal program run (e.g. scripts) posted using a public Github (or similar) Repository.

  Response:
  * This code repository
  
  Extra focus to be place upon the following:
  * Code organisation

    Response:
    * This repository implements the use of an embedded sub-moduble with which to supply most of the functionality.  This module is broken into multiple files from which different components are exported.
    * The tests themselves are broken into different "features" according to the pattern of best practice to BDD development.
  
  * Code readability 
    
    Response:
    * This code base ops to use `typescript` rather than raw `nodejs` whenever possible.  It is this author's opinion that by default this language is more readable as it extensively enforces the author of code to define their intent.
    * The code is meant to be "self documenting" as much as possible.  This is another benefit re-enforced by the choice of `typescript`.
    * JSDoc has been supplied extensively throughout the code base to further document intent of the code and how it functions.
    * The code developed for this repository has been done using `VSCode` in a [devcontainer](https://code.visualstudio.com/docs/remote/containers).  As such, during development it was possible to make use of code "linting" in real time, as well as on demand.  The devcontainer environment has been included in the code base.
    * As part of the CI process, [documentation](https://geneerik.github.io/pltsci-sdet-assignment/docs/) for the code in the repository is generated describing the various components of code created.
* Clear instructions on how to obtain and run the test suite posted using a public Github (or similar) Repository.

  Response:
  * This [readme](README.md) is intended to provide the requisite information on obtaining and running the code.  To skip to that section, follow this [link](#how-to-run-the-tests).
  
  Extra focus to be place upon the following:
  * Quality of instructions

    Response:
    * The [How to Run the Tests](#how-to-run-the-tests) section of this [readme](README.md) file provides extensive and explicit instructions on how to run the tests locally.  Additionally, as this repository utilizes CI via `Github Actions`, the results can be observed directly [here](#the-repository-assets-applicable-to-the-request).
* A short report of the bugs that were detected (if any) posted using a public Github (or similar) Repository.
  
  Response:
  * All discovered or perceived defects or queries have been logged against this application as `Github` [issues](/../../issues).  This gives anyone examining the repository the ability to see what was discovered and how the issue can be reproduced.  This should demonstrate a good pattern for clear and concise defect reporting style.
  * This automation produces an [Allure](https://docs.qameta.io/allure/) report.  This is provided by a plugin which is part of the main CodeceptJS code base.  This report links test failures to the filed [issues](/../../issues) on this `Github` repository.

  Extra focus to be place upon the following:
  * Quality of the report

    Reponse:
    * [Allure](https://docs.qameta.io/allure/) produces a quality report in HTML format.  With links to the `Github` [issues](/../../issues), these two items when combined should provided a quality report which speaks for itself and is mostly (except for the actual issue filing) generated via automated code in CI for this repository (though the automation code COULD be allowed to file defects on its own).

  * Percentage of the detected bugs

    Response:
    * A structure of testing to test "around the edges" has been applied.  This in theory provides the most coverage with the least number of tests to execute.
    * The discovery of the defects in totality is at odds with the an additional parameter which was provided out-of-band to the request that the development of this response should not take more than "2-3 hours tops".  In reality, the production of any one of the components of this request takes entensive time and writing a test plan by itself can take a lot of time, let alone implemented automated tests using a BDD framework or effectively writing up perceived defects.  As such, a "best effort" without extensive time commitment has been applied to the creation of the testing approach.
    * This calculation is likely qualitative as the number of percieved "bugs" could change over time depending on interpretation of the software specifications by the team as well as the SBOM ([Software Bill of Materials](https://www.synopsys.com/blogs/software-security/software-bill-of-materials-bom/)) that comprises this application.  As a Java Spring web applciation which has been stored in a docker image, dependencies of this application could be found to have their own defects which could contribute adversely to the overall quality of the application under test.

    It is also this author's opinion and recommendation that many of the defects to discover will be difficult or obtuse to provde test for as BDD tests as many defects in software are less applicacble to business logic (which is what BDD documents are meant to describe) and would be better targetted with direct testing with code-based tests, including unit tests and dynamic testing (such as fuzzing tests), than with BDD based tests.

The service to be tested is to be executed using `Docker v.18+` via the [Dockerfile](service/Dockerfile) that was supplied. The request was al that it be built using the command `docker build -t pltsci-sdet-assignment service`.  This command was slightly modified to allow it to work with `buildx`, give a more uniquie namespace with which the image could be pushed to an image repository, and to allow it to be tagged in a more CI-friendly way.  The resulting image is the same, but uses a more real-world build implementation. The inital request also asked that the service be started using the command `docker run -d -p 8080:8080 --name pltsci-sdet-assignment pltsci-sdet-assignment`, however this too was modified as the actual CI implementation utilizes docker-compose and has been modified to better fit a realistic CI use-case.

&nbsp;
### The repository assets applicable to the request

[Report](https://geneerik.github.io/pltsci-sdet-assignment)

[Bugs](/../../issues)

[BDD Tests](src/test/javascript/sdet-assignment-service-codeceptsjs/features/)

[BDD Step code](src/test/javascript/sdet-assignment-service-codeceptsjs/step_definitions/steps.ts)

[Utility Module](src/test/javascript/sdet-assignment-service-codeceptsjs/sdet-assignment/)

[Documentation](https://geneerik.github.io/pltsci-sdet-assignment/docs/)

[Server Docker Images](/../../pkgs/container/pltsci-sdet-assignment)

[Test Docker Images](/../../pkgs/container/pltsci-sdet-assignment-tests)

&nbsp;
# How to Run the Tests

A number of ways to run the tests have been provided in order to demonstrate different aspects of the created code base that fange from simple to complex, the more complex of which is intended to provide a full development environment which matches that used to create these tests precisely.  This is meant as a realistic progression of what is required for an actual development effort.

The following are the various differnt ways in which the test code (and the underlying server being tested) can be executed.

&nbsp;
## Using Pre-created Docker Images (fastest to get started; most closely matches request)

This repository uses CI via `Github Actions` in order to generate reusable docker images, which are stored in a publicly accessible docker repo associated with this code repository.  As such, it is possible to provide these pre-created images fairly quickly.  A "one liner" command has been developed for use on any system which has curl, docker, and a bash shell.  This method is the closest to the orignal request and takes the least amount of setup and time. the prerequisites and process are described below.

&nbsp;
### Prerequisites

1) A unix-like system from which to run the test start script.  This could be MacOS, Linux, or Windows with [WSL2](https://docs.microsoft.com/en-us/windows/wsl/install-win10) set up correctly.

2) `docker` and `docker-compose` .
   
   These commands need to be available on the shell and the user who is logged in will need to be able to run docker commands without `sudo`.
   
   For Windows you will need to install `Docker Desktop` with the [WSL 2 Backend](https://docs.docker.com/desktop/windows/install/#wsl-2-backend).
   
   For Mac, install `Docker Desktop` according to the instruction [here](https://docs.docker.com/desktop/mac/install/).

   For Linux, you will need to install `docker` according to the [instructions for your distro](https://docs.docker.com/engine/install/#server) AND make sure that the user you are running as is a member of the group which may access `docker` (usually `docker`).

   Regardless of the operating system under which the tests will be run, the `docker` service will need to be running.  For Windows and Mac, these generally means you will need to start `Docker Desktop`, after which it will stay running int he background and usually restart each time the system boots.  For Linux, there is usually a "service" that starts the `docker` server in the background.  The mechanism by which this works and whether or not it is triggered as part of the `docker` installation is distro dependent.  Please consult the [instructions for your distro](https://docs.docker.com/engine/install/#server) to ensure it is running. 

3) Access to the internet

4) The `curl` tool install.  `curl` is pre-installed on many unix-like systems, including on MacOS.  If it is not installed, it will need to be installed via the system's package manager or some other means.

### Steps to Run Tests

1) Download the [run_tests.sh](run_tests.sh).  The following command can be use to download AND start the tests.  It is the quickest way to do eveything in a single command.

```shell
curl -sL 'https://raw.githubusercontent.com/geneerik/pltsci-sdet-assignment/main/run_tests.sh' | bash
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
(export USE_CODECEPTJS_UI=true; (curl -sL 'https://raw.githubusercontent.com/geneerik/pltsci-sdet-assignment/main/run_tests.sh' | bash))
```

&nbsp;
## Run with workers

This will do concurrency!

&nbsp;
### Prerequisites

You will first need to satisfy the prerequisites for the [Pre-created Docker Images](#prerequisites) method.  In addition to those, you will need the following pre-requisites:

1) `git` .  This tool is used to capture the contents of this repository keeping many important extra bits of information intact.

&nbsp;
### Steps to Run Tests

```shell
(export USE_WORKERS=true; (curl -sL 'https://raw.githubusercontent.com/geneerik/pltsci-sdet-assignment/main/run_tests.sh' | bash))
```

&nbsp;
## Run within VSCode

TODO

# Issues and Pull-Requests
Several issues with the [CodeceptJS](https://codecept.io/) framework were discovered in the process of creating this test repository.  The following are a list of the filed defects (along with applicable pull requests) that have been created as a result fo this process.

## CodeceptJS Issues

TODO

&nbsp;
# Open "ToDo" items for the project
- build the sub module in instead of committing compiled version
- repo tags for test coverage and software quality
- github "project"
- SAST (including coding standards enforcement)
- integrate the Jar compile and unit tests
- Test case management interconnection