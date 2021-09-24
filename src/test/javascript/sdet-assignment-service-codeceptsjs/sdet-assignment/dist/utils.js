"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.spawnWithConsoleIo = exports.isAxiosResponse = exports.waitForLogFileToContainString = exports.deleteFileIfExisted = exports.waitForProcessToBeKilled = exports.checkExistsWithTimeout = exports.setModuleConsolePrefix = exports.generateAllureReport = exports.cleanDir = exports.allureCli = void 0;
const exceptions_1 = require("./exceptions");
const path = require("path");
const fs_extra_1 = require("fs-extra");
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const debug_1 = require("debug");
/**
 * @property {Debugger} debug Debug logger method
 */
const debug = (0, debug_1.debug)("com.geneerik.sdet-assignment.utils");
/**
 * @property {string} moduleConsolePrefix Variable to hold the prefix for all message sent from this
 *                                        module
 */
let moduleConsolePrefix = "";
/**
 * Setter to the set a prefix for all messages sent from this module.  Useful when running in
 * multiple threads or processes
 *
 * @param  {string} newPrefixValue String to prefix the message with
 * @returns {void}
 */
function setModuleConsolePrefix(newPrefixValue) {
    moduleConsolePrefix = newPrefixValue;
}
exports.setModuleConsolePrefix = setModuleConsolePrefix;
/**
 * Spawn and instance of the allure cli program for generating reports
 *
 * @param  {string[]} args The arguements to pass to the allure binary
 * @param  {NullableLooseObject} appendEnv The environmental variables to inject/override for the
 *                                         process envrionment
 * @param  {string} cwd The path to set as the current working directory for the process
 * @param  {number} timeout The amount of time in milliseconds to allow the process to execute
 *                          before timing out and throwing an exception
 * @returns {void}
 */
function allureCli(args, appendEnv, cwd, timeout) {
    // Get the full path to the allure binary
    const allure_commandline_module_path = require.resolve("allure-commandline");
    const allure_commandline_module_dirname = path.dirname(allure_commandline_module_path);
    const isWindows = path.sep === "\\";
    const allureCommand = "allure" + (isWindows ? ".bat" : "");
    const allure_binary_path = path.join(allure_commandline_module_dirname, "dist/bin", allureCommand);
    debug(`${moduleConsolePrefix}Allure commandline binary path: ${allure_binary_path}`);
    // Copy the process env so we can append to the child process env
    const envCopy = Object.assign({}, process.env, appendEnv !== null && appendEnv !== void 0 ? appendEnv : {});
    // allow all input and output to go to the caller's input and output devices
    const allureSpawnStioOpts = [
        "inherit",
        "inherit",
        "inherit"
    ];
    // set the process options
    const allureSpawnOpts = {
        cwd: cwd,
        env: envCopy,
        stdio: allureSpawnStioOpts,
        timeout: timeout
    };
    // Start and wait for completion of execution of the binary
    (0, child_process_1.spawnSync)(allure_binary_path, args, allureSpawnOpts);
}
exports.allureCli = allureCli;
/**
 * Generate Allure Report in the `reportOutputDir` from the test results in the `testOutputDir`
 * directory
 *
 * @param {string} testOutputDir The directory holding the test results to generate the report
 *                               from
 * @param  {string} reportOutputDir The directory into which the generate report will be placed
 * @param  {string} issueTrackerPattern The pattern used to generate issue URIs for tests tagged
 *                                      with issues
 * @param  {boolean} shouldGenerateReport Whether or not tp actually generate the report
 * @param  {boolean} verboseInput Whether or not to run the report generate with verbose output
 * @param  {number} timeoutInput The maximum time to allow report generation to run before
 *                               stopping and raising an exception
 * @returns {void}
 */
function generateAllureReport(testOutputDir, reportOutputDir, issueTrackerPattern, shouldGenerateReport, verboseInput, timeoutInput) {
    // Set defaults if values not provided
    const resolvedTestOutputDir = testOutputDir !== null && testOutputDir !== void 0 ? testOutputDir : "./output";
    const resolvedReportOutputDir = reportOutputDir !== null && reportOutputDir !== void 0 ? reportOutputDir : "./report";
    const resolvedShouldGenerateReport = shouldGenerateReport !== null && shouldGenerateReport !== void 0 ? shouldGenerateReport : true;
    const verbose = verboseInput !== null && verboseInput !== void 0 ? verboseInput : false;
    const timeout = timeoutInput !== null && timeoutInput !== void 0 ? timeoutInput : 30000;
    const destinationDir = path.isAbsolute(resolvedReportOutputDir) ?
        resolvedReportOutputDir :
        path.resolve(resolvedReportOutputDir);
    const xunitOutputDir = path.isAbsolute(resolvedTestOutputDir) ?
        resolvedTestOutputDir :
        path.resolve(resolvedTestOutputDir);
    // generate launcher
    if (resolvedShouldGenerateReport) {
        console.info(`${moduleConsolePrefix}Making report now`);
        allureCli(
        // call allure binary to generate report.  optionally inject the verbose flag
        (verbose ? ["-v"] : []).concat([
            "generate", "--report-dir", destinationDir, xunitOutputDir
        ]), {
            /**
             *  Set the issue tracker uri pattern if one was provided.  This allows a link to
             * an issue tracking system (like github issues)
             */
            ALLURE_OPTS: issueTrackerPattern ?
                `-Dallure.issues.tracker.pattern=${issueTrackerPattern}` :
                ""
        }, undefined, 
        // Make sure we have a timeout so the binary doesnt get "stuck"
        timeout);
        console.info(`${moduleConsolePrefix}Allure reports generated in "${destinationDir}" ...`);
    }
}
exports.generateAllureReport = generateAllureReport;
/**
 * Empty out an existing directory if it has contents
 *
 * @param  {string} dirPath The directory whose contents will be removed
 * @returns {void}
 */
function cleanDir(dirPath) {
    if (!dirPath) {
        throw Error("Dir path to clean is not defined");
    }
    // Get the absolute path to the directory
    const targetDir = path.isAbsolute(dirPath) ?
        dirPath :
        path.resolve(dirPath);
    console.info(`${moduleConsolePrefix}cleaning dir "${targetDir}" ...`);
    // empty the directory
    (0, fs_extra_1.emptyDirSync)(targetDir);
}
exports.cleanDir = cleanDir;
/**
 * Wait for a file to exist
 *
 * @param  {string} filePath The path to the file to be waited for
 * @param  {number|undefined} timeout Time to wait for file to exist in milliseconds
 * @returns {Promise} Promise to ensure the string exists in the file or throw a timeout exception
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
        debug(`${moduleConsolePrefix}watching for file "${basename}" in dir ${dir}`);
        watcher = (0, fs_extra_1.watch)(dir, function (eventType, filename) {
            if (eventType === "rename" && filename === basename) {
                debug(`${moduleConsolePrefix}Detected file "${basename}" in dir ${dir}!`);
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
 * @param  {number|null|undefined} timeoutInput The maximum amount of time in milliseconds to
 *                                              wait for the process to end before throwing an
 *                                              exception
 * @param  {number|null|undefined} pollingIntervalInput The interval in milliseconds after which
 *                                                      to poll to check if the process has ended
 * @returns {Promise} Promise to ensure process is killed or throw a timeout exception
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
        debug(`${moduleConsolePrefix}Server process with PID ${pid} was killed`);
    }
    else {
        console.warn(`${moduleConsolePrefix}Server process with PID ${pid} was not killed`);
    }
    // Now wait for it to really be gone
    return new Promise(function (resolve, reject) {
        debug(`${moduleConsolePrefix}Waiting for pid ${pid} to finish`);
        // Set max timeout
        let pollingTimer = undefined;
        // Start the timer
        const maxTimeoutTimer = setTimeout(() => {
            // unset the interval time if running
            if (pollingTimer) {
                clearTimeout(pollingTimer);
            }
            // reject with timeout exception
            reject(new exceptions_1.TimeoutError(`${moduleConsolePrefix}Timeout shutting down server process with pid ` +
                `${pid}`));
        }, timeout);
        const pollingFunction = () => {
            // check if the exit code is set indicating the process has ended
            if (null !== processObject.exitCode) {
                debug(`${moduleConsolePrefix}Server process with pid ${pid} exitted with code` +
                    `${processObject.exitCode}`);
                // Disable the timeout timer and return positive
                clearTimeout(maxTimeoutTimer);
                resolve();
            }
            else {
                debug(`${moduleConsolePrefix}Still waiting for pid ${pid} to finish`);
                // restart the interval polling timer
                pollingTimer = setTimeout(pollingFunction, pollingInterval);
            }
        };
        // start the interval polling timer
        pollingTimer = setTimeout(pollingFunction, pollingInterval);
    });
}
exports.waitForProcessToBeKilled = waitForProcessToBeKilled;
/**
 * Delete a file if it exists, returning a promise to be resolved if the operation succeeds or
 * reject with an error if it fails
 *
 * @param  {string} targetFile The file to delete
 * @returns {Promise<boolean>} Promise to be resolved if the operation succeeds or reject with an
 *                             error if it fails; promise holds the boolean as to whether or not a
 *                             file was deleted
 */
function deleteFileIfExisted(targetFile) {
    let fileDidExist = false;
    /**
     * Check if we can see the file; throw an exception on some problem checking or the file doesnt
     * exist
     */
    try {
        (0, fs_extra_1.accessSync)(targetFile, fs_extra_1.constants.F_OK);
        fileDidExist = true;
    }
    catch (err) {
        // eat the exception
    }
    // delete the file if it existed
    if (fileDidExist) {
        debug(`${moduleConsolePrefix}Deleting ready file ${targetFile}`);
        /**
         * resolve with true value if the file is successfully deleted or reject with the exception
         * if there was an error
         */
        return new Promise((resolve, reject) => {
            (0, fs_1.rm)(targetFile, (err) => {
                if (err) {
                    reject(err);
                }
                resolve(true);
            });
        });
    }
    debug(`${moduleConsolePrefix}Ready file ${targetFile} did not exist`);
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
 * @param  {number|null|undefined} timeoutInput The maximum amount of time in milliseconds to
 *                                              wait for the string to be found before throwing an
 *                                              exception and shutting down the process if given
 * @param  {number|null|undefined} pollingIntervalInput The interval in milliseconds after which
 *                                                      to poll to check if the log file contains
 *                                                      the specified string
 * @param  {ChildProcess|null|undefined} process_object The process to shut down if the timeout is
 *                                                      hit
 * @returns {Promise} Promise to ensure the string exists in the file or throw a timeout exception
 */
function waitForLogFileToContainString(logFile, stringToFind, timeoutInput, pollingIntervalInput, process_object) {
    // Set defaults if values not provided
    const timeout = timeoutInput !== null && timeoutInput !== void 0 ? timeoutInput : 30000;
    const pollingInterval = pollingIntervalInput !== null && pollingIntervalInput !== void 0 ? pollingIntervalInput : 100;
    return new Promise(function (resolve, reject) {
        debug(`${moduleConsolePrefix}Waiting for logfile to contain string`);
        // Set max timeout
        let pollingTimer = undefined;
        // Start the timer
        const maxTimeoutTimer = setTimeout(() => {
            // unset the interval time if running
            if (pollingTimer) {
                clearTimeout(pollingTimer);
            }
            // kill the process if provided
            if (process_object) {
                process_object.kill();
            }
            // reject with timeout exception
            reject(new exceptions_1.TimeoutError(`${moduleConsolePrefix}Timeout waiting for logfile to contain string`));
        }, timeout);
        const pollingFunction = () => {
            let logContents;
            try {
                // read the contents of the file
                logContents = (0, fs_extra_1.readFileSync)(logFile);
            }
            catch (err) {
                // on error
                // kill the process if provided
                if (process_object) {
                    process_object.kill();
                }
                // reject with timeout exception
                reject(err);
            }
            // scan the contents of the file for the provided string
            if (logContents !== undefined && logContents.includes(stringToFind)) {
                debug(`${moduleConsolePrefix}String found in logfile!`);
                // Disable the timeout timer and return positive
                clearTimeout(maxTimeoutTimer);
                resolve();
            }
            else {
                debug(`${moduleConsolePrefix}Still waiting for logfile to contain string`);
                // restart the interval polling timer
                pollingTimer = setTimeout(pollingFunction, pollingInterval);
            }
        };
        // start the interval polling timer
        pollingTimer = setTimeout(pollingFunction, pollingInterval);
    });
}
exports.waitForLogFileToContainString = waitForLogFileToContainString;
/**
 * Check if an object appears to implement the AxiosResponse interface
 *
 * @param  {unknown} maybeAxiosResponse The variable to evaluate as to whether or not implements
 *                                      the `AxiosResponse` interface
 * @returns {boolean} Whether of not the given variable represents and implememntation of the
 *                    `AxiosResponse` interface
 */
function isAxiosResponse(maybeAxiosResponse) {
    // check if unknown is an object
    if (!(maybeAxiosResponse instanceof Object)) {
        return false;
    }
    // Check if object has all the require properties/methods
    return "data" in maybeAxiosResponse && "status" in maybeAxiosResponse &&
        "statusText" in maybeAxiosResponse && "headers" in maybeAxiosResponse &&
        "config" in maybeAxiosResponse && "request" in maybeAxiosResponse;
}
exports.isAxiosResponse = isAxiosResponse;
/**
 * Spawn a process in the background with its I/O tied to the console
 *
 * @param  {string} command The command to execute
 * @param  {string[]} args Arguments to pass to the command
 * @param  {SpawnOptionsWithoutStdio|undefined} options Options to define process settings
 * @returns {ChildProcess} Object representing the newly spawned process
 */
function spawnWithConsoleIo(command, args, options) {
    const process_object = (0, child_process_1.spawn)(command, args, options);
    // set stdout of the process to go to the console
    if (process_object.stdout) {
        process_object.stdout.on("data", (data) => {
            console.info(`${moduleConsolePrefix}service stdout: ${data}`);
        });
    }
    // set stderr of the process to go to the console
    if (process_object.stderr) {
        process_object.stderr.on("data", (data) => {
            console.error(`${moduleConsolePrefix}service stderr: ${data}`);
        });
    }
    // Send a message when the server process terminates
    process_object.on("close", (code, signal) => {
        debug(`${moduleConsolePrefix}Server process terminated due to receipt of signal ` +
            `${signal}`);
    });
    return process_object;
}
exports.spawnWithConsoleIo = spawnWithConsoleIo;
