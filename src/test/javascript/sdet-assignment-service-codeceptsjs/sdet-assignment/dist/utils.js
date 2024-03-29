"use strict";
/**
 * Module to hold the custom Interfaces to be used by the library.
 *
 * @module sdet-assignment.utils
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAllureFileAttachmentToTest = exports.addAllureAttachmentToTest = exports.traslateAllureTagsForTest = exports.issueTagRegex = exports.isDryRun = exports.escapeStringRegexp = exports.spawnWithConsoleIo = exports.isAxiosResponse = exports.waitForLogFileToContainString = exports.deleteFileIfExisted = exports.waitForProcessToBeKilled = exports.checkExistsWithTimeout = exports.setModuleConsolePrefix = exports.generateAllureReport = exports.cleanDir = exports.allureCli = void 0;
const exceptions_1 = require("./exceptions");
const path = __importStar(require("path"));
const fs_extra_1 = require("fs-extra");
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const codeceptjs_1 = require("codeceptjs");
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
/**
 * Escape the given string so that it can be used safely within a regular expression
 *
 * @param  {string} stringToEscape The string to be modified so that it can be used safely within a
 *                                 regular expression
 * @returns {string} The `stringToEscape` modified to escape control characters for the regular
 *                   expression engine
 */
function escapeStringRegexp(stringToEscape) {
    // adapted from https://github.com/sindresorhus/escape-string-regexp/blob/v5.0.0/index.js
    /**
     * MIT License
     *
     * Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy of this
     * software and associated documentation files (the "Software"), to deal in the Software
     * without restriction, including without limitation the rights to use, copy, modify, merge,
     * publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
     * to whom the Software is furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in all copies or
     * substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
     * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
     * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
     * FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
     * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
     * DEALINGS IN THE SOFTWARE.
     */
    /**
     * The package is not included becuase it is 1 small function which has trouble loading.
     * The function has been included with its license instead to meet MIT liscence criteria.
     */
    if (typeof stringToEscape !== "string") {
        throw new TypeError("Expected a string");
    }
    /**
     * Escape characters with special meaning either inside or outside character sets.
     * Use a simple backslash escape when it’s always valid, and a `\xnn` escape when the simpler
     * form would be disallowed by Unicode patterns’ stricter grammar.
     */
    return stringToEscape
        .replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")
        .replace(/-/g, "\\x2d");
}
exports.escapeStringRegexp = escapeStringRegexp;
/**
 * Determine whether or not "dry-run" mode is enabled for the current codeceptj execution context
 *
 * @returns {boolean} Whether or not the dryrun property is set to true in the codeceptjs store
 */
function isDryRun() {
    // Bail out if this is a dry
    const store = codeceptjs_1.store;
    if (store["dryRun"])
        return true;
    return false;
}
exports.isDryRun = isDryRun;
/**
 * @property Regular expression object which will match issue tags
 */
const issueTagRegex = new RegExp((_a = process.env.DEFAULT_ISSUE_REGEX) !== null && _a !== void 0 ? _a : (process.env.DEFAULT_ISSUE_PREFIX ?
    "^" + escapeStringRegexp(process.env.DEFAULT_ISSUE_PREFIX) + "(.+)$" :
    "^@ISSUE:(.+)$"), "i");
exports.issueTagRegex = issueTagRegex;
/**
 * Remove existing tags that match the give tag patterns and replace them with allure tags so that
 * the allure report can accurately reflect the information they convey, such as issues associated
 * with a given feature or scenario
 *
 * @param  {Mocha.Test} test The test to be modified
 */
function traslateAllureTagsForTest(test) {
    const allurePlugin = codeceptjs.container.plugins("allure");
    if (!allurePlugin) {
        return;
    }
    const testTitle = test.fullTitle();
    debug(`(${moduleConsolePrefix}traslateAllureTagsForTest for '${testTitle}'`);
    // todo: deal with suite level tags
    // todo: implement this for other allure tag types:
    /**
     * @Link("https://example.org")
     * @Link(name = "allure", type = "mylink")
     * @flaky
     * - <label name="status_details" value="flaky"/>
     * @package:
     * @epic:
     * @story:
     * DEFAULT_TMS_PREFIX      = '@TMS:'
     * - testId
     * DEFAULT_ISSUE_PREFIX    = '@ISSUE:'
     * DEFAULT_SEVERITY_PREFIX = '@SEVERITY:'
     *
     * Add functions:
     *       <label name="host" value="my.cool.host.com"/>
     *       <label name="thread" value="pool-1-thread-4"/>
     *       <label name="framework" value="JUnit"/>
     *       <label name="language" value="JAVA"/>
     *       <label name="historyId" value="something"/>
     *
     * OWNER("owner"),
     * @screenshotDiff
     *  <label name="testType" value="screenshotDiff"/>
        TEST_TYPE("testType"),
PACKAGE("package"),
TEST_CLASS("testClass"),
TEST_METHOD("testMethod"),

// Set by automation
HOST("host"),
THREAD("thread"),
LANGUAGE("language"),
FRAMEWORK("framework"),
     */
    const testTags = test.tags;
    const nonIssueTags = [];
    const issueTags = [];
    const issueValues = [];
    testTags.forEach(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (value, index, array) => {
        debug(`(${moduleConsolePrefix}Plugin cycling tags '${value}' on '${testTitle}'`);
        const matches = issueTagRegex.exec(value);
        if (null === matches || undefined === matches) {
            debug(`(${moduleConsolePrefix}!! Plugin tag '${value}' didnt match on ` +
                `'${testTitle}'`);
            nonIssueTags.push(value);
            return;
        }
        debug(`(${moduleConsolePrefix}Plugin tag '${value}' has matches on '${testTitle}'`);
        /*const groups = matches.groups;
        if(null === groups || undefined === groups) {*/
        if (matches.length < 2) {
            debug(`(${moduleConsolePrefix}!! Plugin tag '${value}' match has no groups on ` +
                `'${testTitle}'`);
            nonIssueTags.push(value);
            return;
        }
        debug(`(${moduleConsolePrefix}Plugin tag '${value}' has match groups on '${testTitle}'`);
        //const issueValue = groups[1];
        const issueValue = matches[1];
        if (null === issueValue || undefined === issueValue) {
            nonIssueTags.push(value);
            return;
        }
        debug(`(${moduleConsolePrefix}Plugin found tag '${value}' value '${issueValue}' on ` +
            `'${testTitle}'`);
        issueTags.push(value);
        issueValues.push(issueValue);
    });
    // Remove any tags matching our pattern from the list of normal tags
    test.tags = nonIssueTags;
    // convert tags matching the pattern to allure issu tags
    issueValues.forEach(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (value, index, array) => {
        debug(`(${moduleConsolePrefix}Plugin adding issue '${value}' on '${testTitle}'`);
        allurePlugin.issue(value);
    });
    // This code is presently useless as it doesnt effect the report
    /*
    // remove the matching tags from the end of the test name
    let updatedTestName = test.title;

    issueTags.forEach (
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (value: string, index: number, array: string[]) => {
            const escapedTagName = escapeStringRegexp(value);
            const tagRegex = new RegExp(
                " " + escapedTagName + "\\b(?! " + escapedTagName + "\\b)");
            updatedTestName = updatedTestName.replace(tagRegex, "");

            debug(
                `(${moduleConsolePrefix}Plugin new test name from '${testTitle}' is now ` +
                `'${updatedTestName}' on '${value}' using '${tagRegex.source}'`);
        }
    );

    updatedTestName = updatedTestName.trimRight();
    debug(
        `(${moduleConsolePrefix}Plugin final test name is now ` +
        `'${updatedTestName}' on '${testTitle}'`);


    test.title = updatedTestName;
    */
}
exports.traslateAllureTagsForTest = traslateAllureTagsForTest;
/**
 * Add an attachment to current test / suite. This is meant for general user supplied attachments
 *
 * @param  {string} path The name of the file
 * @param  {string} mimeType The type of the attachment (fileMime). If the value is null or
 *                           undefined, the fileType can be automatically guessed (not recomended)
 *                           by the file-type library
 * @param  {string} desiredFileName The name for the attachment (file name)
 * @returns void
 */
function addAllureFileAttachmentToTest(filePath, mimeType, desiredFileName) {
    const targetFileName = desiredFileName !== null && desiredFileName !== void 0 ? desiredFileName : path.basename(filePath);
    const fileContents = (0, fs_extra_1.readFileSync)(filePath);
    addAllureAttachmentToTest(targetFileName, fileContents, mimeType);
}
exports.addAllureFileAttachmentToTest = addAllureFileAttachmentToTest;
/**
 * Add an attachment to current test / suite. This is meant for general user supplied attachments
 *
 * @param  {string} desiredFileName The name for the attachment (file name)
 * @param  {Buffer} fileContents The content comprising the attachment (binary bytes)
 * @param  {string} mimeType The type of the attachment (fileMime). If the value is null or
 *                           undefined, the fileType can be automatically guessed (not recomended)
 *                           by the file-type library
 * @returns void
 */
function addAllureAttachmentToTest(desiredFileName, fileContents, mimeType) {
    const allurePlugin = codeceptjs.container.plugins("allure");
    if (!allurePlugin) {
        return;
    }
    debug(`(${moduleConsolePrefix}Adding attchment '${desiredFileName}' of type '${mimeType}' to ` +
        "current test");
    allurePlugin.addAttachment(desiredFileName, fileContents, mimeType);
}
exports.addAllureAttachmentToTest = addAllureAttachmentToTest;
