"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForLogFileToContainString = exports.deleteFileIfExisted = exports.waitForProcessToBeKilled = exports.checkExistsWithTimeout = exports.setModuleConsolePrefix = exports.generateAllureReport = exports.cleanDir = exports.allureCli = void 0;
const exceptions_1 = require("./exceptions");
const path = require("path");
const fs_extra_1 = require("fs-extra");
const fs_1 = require("fs");
const child_process_1 = require("child_process");
let moduleConsolePrefix = "";
function setModuleConsolePrefix(newPrefixValue) {
    moduleConsolePrefix = newPrefixValue;
}
exports.setModuleConsolePrefix = setModuleConsolePrefix;
/**
 * Spawn and instance of the allure cli program for gnerating reports
 *
 * @param  {string[]} args
 * @param  {NullableLooseObject} appendEnv?
 * @param  {string} cwd?
 * @param  {number} timeout?
  */
function allureCli(args, appendEnv, cwd, timeout) {
    const allure_commandline_module_path = require.resolve("allure-commandline");
    const allure_commandline_module_dirname = path.dirname(allure_commandline_module_path);
    const isWindows = path.sep === "\\";
    const allureCommand = "allure" + (isWindows ? ".bat" : "");
    const allure_binary_path = path.join(allure_commandline_module_dirname, "dist/bin", allureCommand);
    console.debug(`${moduleConsolePrefix}Allure commandline binary path: ${allure_binary_path}`);
    // Copy the process env so we can append to the child process env
    const envCopy = Object.assign({}, process.env, appendEnv !== null && appendEnv !== void 0 ? appendEnv : {});
    const allureSpawnStioOpts = [
        "inherit",
        "inherit",
        "inherit"
    ];
    const allureSpawnOpts = {
        cwd: cwd,
        env: envCopy,
        stdio: allureSpawnStioOpts,
        timeout: timeout
    };
    (0, child_process_1.spawnSync)(allure_binary_path, args, allureSpawnOpts);
}
exports.allureCli = allureCli;
/**
 * Generate Allure Report
 *
 * @param  {string} testOutputDir?
 * @param  {string} reportOutputDir?
 * @param  {string} issueTrackerPattern?
 * @param  {boolean} shouldGenerateReport?
 * @returns void
 */
function generateAllureReport(testOutputDir, reportOutputDir, issueTrackerPattern, shouldGenerateReport) {
    const resolvedTestOutputDir = testOutputDir !== null && testOutputDir !== void 0 ? testOutputDir : "./output";
    const resolvedReportOutputDir = reportOutputDir !== null && reportOutputDir !== void 0 ? reportOutputDir : "./report";
    const resolvedShouldGenerateReport = shouldGenerateReport !== null && shouldGenerateReport !== void 0 ? shouldGenerateReport : true;
    const destinationDir = path.isAbsolute(resolvedReportOutputDir) ?
        resolvedReportOutputDir :
        path.join(process.cwd(), resolvedReportOutputDir);
    const xunitOutputDir = path.isAbsolute(resolvedTestOutputDir) ?
        resolvedTestOutputDir :
        path.join(process.cwd(), resolvedTestOutputDir);
    // generate launcher
    if (resolvedShouldGenerateReport) {
        console.info(`${moduleConsolePrefix}Making report now`);
        allureCli([
            // "-v",
            "generate", "--report-dir", destinationDir, xunitOutputDir
        ], {
            ALLURE_OPTS: issueTrackerPattern ?
                `-Dallure.issues.tracker.pattern=${issueTrackerPattern}` :
                ""
        }, undefined, 30000);
        console.info(`${moduleConsolePrefix}Allure reports generated in "${destinationDir}" ...`);
    }
}
exports.generateAllureReport = generateAllureReport;
/**
 * Empty out an existing directory if it has contents
 *
 * @param  {string} dirPath
 */
function cleanDir(dirPath) {
    if (!dirPath) {
        throw Error("Dir path to clean is not defined");
    }
    const targetDir = path.isAbsolute(dirPath) ?
        dirPath :
        path.join(process.cwd(), dirPath);
    console.info(`${moduleConsolePrefix}cleaning dir "${targetDir}" ...`);
    (0, fs_extra_1.emptyDirSync)(targetDir);
}
exports.cleanDir = cleanDir;
/**
 * Wait for a file to exist
 *
 * @param  {string} filePath The path to the file to be waited for
 * @param  {number|undefined} timeout Time to wait for file to exist in milliseconds
 * @returns Promise
 */
function checkExistsWithTimeout(filePath, timeout) {
    return new Promise(function (resolve, reject) {
        let watcher = undefined;
        const timer = setTimeout(function () {
            if (watcher) {
                watcher.close();
            }
            reject(new exceptions_1.TimeoutError(`${moduleConsolePrefix}File "${filePath}" ` +
                "did not exists and was not created during the timeout."));
        }, timeout);
        (0, fs_extra_1.access)(filePath, fs_extra_1.constants.R_OK, function (err) {
            if (!err) {
                clearTimeout(timer);
                if (watcher) {
                    watcher.close();
                }
                console.warn(`${moduleConsolePrefix}File "${filePath}" already exists`);
                resolve();
            }
        });
        const dir = path.dirname(filePath);
        const basename = path.basename(filePath);
        console.debug(`${moduleConsolePrefix}watching for file "${basename}" in dir ${dir}`);
        watcher = (0, fs_extra_1.watch)(dir, function (eventType, filename) {
            if (eventType === "rename" && filename === basename) {
                console.debug(`${moduleConsolePrefix}Detected file "${basename}" in dir ${dir}!`);
                clearTimeout(timer);
                if (watcher) {
                    watcher.close();
                }
                resolve();
            }
        });
    });
}
exports.checkExistsWithTimeout = checkExistsWithTimeout;
/**
 * Produce a promise to wait for the `process_object` to be killed or timeout with an exception
 *
 * @param  {ChildProcess} processObject The process to kill
 * @param  {number|null|undefined} timeoutInput? The maximum amount of time in milliseconds to
 *                                               wait for the process to end before throwing an
 *                                               exception
 * @param  {number|null|undefined} pollingIntervalInput? The interval in milliseconds after which
 *                                                       to poll to check if the process has ended
 * @returns Promise to ensure process is killed or throw a timeout exception
 */
function waitForProcessToBeKilled(processObject, timeoutInput, pollingIntervalInput) {
    // Set defaults if values not provided
    const timeout = timeoutInput !== null && timeoutInput !== void 0 ? timeoutInput : 10000;
    const pollingInterval = pollingIntervalInput !== null && pollingIntervalInput !== void 0 ? pollingIntervalInput : 100;
    const pid = processObject.pid;
    /*
     * stop the service in the background if not in docker compose mode and the state
     * object has server_process object
     */
    if (processObject.kill()) {
        console.debug(`${moduleConsolePrefix}Server process with PID ${pid} was killed`);
    }
    else {
        console.warn(`${moduleConsolePrefix}Server process with PID ${pid} was not killed`);
    }
    // Now wait for it to really be gone
    return new Promise(function (resolve, reject) {
        console.debug(`${moduleConsolePrefix}Waiting for pid ${pid} to finish`);
        // Set max timeout
        let pollingTimer = undefined;
        // Start the timer
        const maxTimeoutTimer = setTimeout(() => {
            if (pollingTimer) {
                // Shut down the interval timer
                clearTimeout(pollingTimer);
            }
            reject(new exceptions_1.TimeoutError(`${moduleConsolePrefix}Timeout shutting down server process with pid ` +
                `${pid}`));
        }, timeout);
        const pollingFunction = () => {
            // check if the exit code is set indicating the process has ended
            if (null !== processObject.exitCode) {
                console.debug(`${moduleConsolePrefix}Server process with pid ${pid} exitted with code` +
                    `${processObject.exitCode}`);
                // Disable the timeout timer and return positive
                clearTimeout(maxTimeoutTimer);
                resolve();
            }
            else {
                console.debug(`${moduleConsolePrefix}Still waiting for pid ${pid} to finish`);
                pollingTimer = setTimeout(pollingFunction, pollingInterval);
            }
        };
        pollingTimer = setTimeout(pollingFunction, pollingInterval);
    });
}
exports.waitForProcessToBeKilled = waitForProcessToBeKilled;
/**
 * Delete a file if it exists, returning a promise to be resolved if the operation succeeds or
 * reject with an error if it fails
 *
 * @param  {string} targetFile The file to delete
 * @returns Promise to be resolved if the operation succeeds or reject with an error if it fails
 */
function deleteFileIfExisted(targetFile) {
    let fileDidExist = false;
    try {
        (0, fs_extra_1.accessSync)(targetFile, fs_extra_1.constants.F_OK);
        fileDidExist = true;
    }
    catch (err) {
        // eat the exception
    }
    // delete the file if it existed
    if (fileDidExist) {
        console.debug(`${moduleConsolePrefix}Deleting ready file ${targetFile}`);
        return new Promise((resolve, reject) => {
            (0, fs_1.rm)(targetFile, (err) => {
                if (err) {
                    reject(err);
                }
                resolve(true);
            });
        });
    }
    console.debug(`${moduleConsolePrefix}Ready file ${targetFile} did not exist`);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise((resolve, reject) => { resolve(false); });
}
exports.deleteFileIfExisted = deleteFileIfExisted;
/**
 * Monitor a file for a give string until a timeout is hit.  Optionally kill the given process if
 * the timeout is hit.
 *
 * @param  {PathOrFileDescriptor} logFile The log file to monitor
 * @param  {string} stringToFind The string to search for in the log file
 * @param  {number|null|undefined} timeoutInput? The maximum amount of time in milliseconds to
 *                                               wait for the string to be found before throwing an
 *                                               exception and shutting down the process if given
 * @param  {number|null|undefined} pollingIntervalInput? The interval in milliseconds after which
 *                                                       to poll to check if the log file contains
 *                                                       the specified string
 * @param  {ChildProcess|null|undefined} process_object? The process to shut down if the timeout is
 *                                                       hit
 * @returns Promise to ensure the string exists in the file or throw a timeout exception
 */
function waitForLogFileToContainString(logFile, stringToFind, timeoutInput, pollingIntervalInput, process_object) {
    // Set defaults if values not provided
    const timeout = timeoutInput !== null && timeoutInput !== void 0 ? timeoutInput : 30000;
    const pollingInterval = pollingIntervalInput !== null && pollingIntervalInput !== void 0 ? pollingIntervalInput : 100;
    return new Promise(function (resolve, reject) {
        console.debug(`${moduleConsolePrefix}Waiting for logfile to contain string`);
        // Set max timeout
        let pollingTimer = undefined;
        // Start the timer
        const maxTimeoutTimer = setTimeout(() => {
            if (pollingTimer) {
                clearTimeout(pollingTimer);
            }
            if (process_object) {
                process_object.kill();
            }
            reject(new exceptions_1.TimeoutError(`${moduleConsolePrefix}Timeout waiting for logfile to contain string`));
        }, timeout);
        const pollingFunction = () => {
            let logContents;
            try {
                logContents = (0, fs_extra_1.readFileSync)(logFile);
            }
            catch (err) {
                if (process_object) {
                    process_object.kill();
                }
                reject(err);
            }
            if (logContents !== undefined && logContents.includes(stringToFind)) {
                console.debug(`${moduleConsolePrefix}String found in logfile!`);
                clearTimeout(maxTimeoutTimer);
                resolve();
            }
            else {
                console.debug(`${moduleConsolePrefix}Still waiting for logfile to contain string`);
                pollingTimer = setTimeout(pollingFunction, pollingInterval);
            }
        };
        pollingTimer = setTimeout(pollingFunction, pollingInterval);
    });
}
exports.waitForLogFileToContainString = waitForLogFileToContainString;
