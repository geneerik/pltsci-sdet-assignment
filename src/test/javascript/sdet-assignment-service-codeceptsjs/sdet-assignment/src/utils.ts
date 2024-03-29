/**
 * Module to hold the custom Interfaces to be used by the library.
 *
 * @module sdet-assignment.utils
 */

import { NullableLooseObject, CodeceptJSStore, CodeceptJSAllurePlugin } from "./interfaces";
import { TimeoutError } from "./exceptions";
import * as path from "path";
import {
    access, watch, FSWatcher, constants as fs_constants, emptyDirSync,
    accessSync, PathOrFileDescriptor, readFileSync } from "fs-extra";
import { rm } from "fs";
import { spawnSync, SpawnOptions, StdioOptions, ChildProcess, spawn,
    SpawnOptionsWithoutStdio } from "child_process";
import { AxiosResponse } from "axios";
import { store as codeceptjs_store } from "codeceptjs";
import { Debugger, debug as debugLoggerFactory } from "debug";

/**
 * @property {Debugger} debug Debug logger method
 */
const debug: Debugger = debugLoggerFactory("com.geneerik.sdet-assignment.utils");

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
function setModuleConsolePrefix(newPrefixValue: string): void {
    moduleConsolePrefix = newPrefixValue;
}

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
function allureCli(
    args:string[], appendEnv?:NullableLooseObject, cwd?:string, timeout?:number): void {
        
    // Get the full path to the allure binary
    const allure_commandline_module_path = require.resolve("allure-commandline");
    const allure_commandline_module_dirname = path.dirname(allure_commandline_module_path);
    const isWindows = path.sep === "\\";
    const allureCommand = "allure" + (isWindows ? ".bat" : "");
    const allure_binary_path =
        path.join(allure_commandline_module_dirname, "dist/bin", allureCommand);

    debug(`${moduleConsolePrefix}Allure commandline binary path: ${allure_binary_path}`);

    // Copy the process env so we can append to the child process env
    const envCopy: NullableLooseObject =
        Object.assign({}, process.env, appendEnv ?? {});

    // allow all input and output to go to the caller's input and output devices
    const allureSpawnStioOpts: StdioOptions = [
        "inherit",
        "inherit",
        "inherit"
    ];

    // set the process options
    const allureSpawnOpts: SpawnOptions = {
        cwd: cwd,    
        env: envCopy,
        stdio: allureSpawnStioOpts,
        timeout: timeout
    };

    // Start and wait for completion of execution of the binary
    spawnSync(allure_binary_path, args, allureSpawnOpts);
}

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
function generateAllureReport(
    testOutputDir?:string, reportOutputDir?:string, issueTrackerPattern?:string,
    shouldGenerateReport?:boolean, verboseInput?:boolean, timeoutInput?:number): void {

    // Set defaults if values not provided
    const resolvedTestOutputDir = testOutputDir ?? "./output";
    const resolvedReportOutputDir = reportOutputDir ?? "./report";
    const resolvedShouldGenerateReport = shouldGenerateReport ?? true;
    const verbose = verboseInput ?? false;
    const timeout = timeoutInput ?? 30000;

    const destinationDir = 
        path.isAbsolute(resolvedReportOutputDir) ?
            resolvedReportOutputDir :
            path.resolve(resolvedReportOutputDir);

    const xunitOutputDir = 
        path.isAbsolute(resolvedTestOutputDir) ?
            resolvedTestOutputDir :
            path.resolve(resolvedTestOutputDir);

    // generate launcher
    if (resolvedShouldGenerateReport) {
        console.info(`${moduleConsolePrefix}Making report now`);
        
        allureCli(
            // call allure binary to generate report.  optionally inject the verbose flag
            (verbose?["-v"]:[]).concat([
                "generate", "--report-dir", destinationDir, xunitOutputDir]),
            {
                /**
                 *  Set the issue tracker uri pattern if one was provided.  This allows a link to
                 * an issue tracking system (like github issues)
                 */
                ALLURE_OPTS: 
                    issueTrackerPattern ?
                        `-Dallure.issues.tracker.pattern=${issueTrackerPattern}` :
                        ""
            },                             
            undefined,
            // Make sure we have a timeout so the binary doesnt get "stuck"
            timeout);

        console.info(`${moduleConsolePrefix}Allure reports generated in "${destinationDir}" ...`);
    }
}

/**
 * Empty out an existing directory if it has contents
 *
 * @param  {string} dirPath The directory whose contents will be removed
 * @returns {void}
 */
function cleanDir (dirPath:string): void {
    if (!dirPath) {
        throw Error("Dir path to clean is not defined");
    }

    // Get the absolute path to the directory
    const targetDir = path.isAbsolute(dirPath) ?
        dirPath :
        path.resolve(dirPath);

    console.info(`${moduleConsolePrefix}cleaning dir "${targetDir}" ...`);

    // empty the directory
    emptyDirSync(targetDir);
}

/**
 * Wait for a file to exist
 *
 * @param  {string} filePath The path to the file to be waited for
 * @param  {number|undefined} timeout Time to wait for file to exist in milliseconds
 * @returns {Promise} Promise to ensure the string exists in the file or throw a timeout exception
 */
function checkExistsWithTimeout(filePath: string, timeout:number | undefined): Promise<void> {
    return new Promise<void>(function (resolve, reject) {
        let watcher:FSWatcher|undefined = undefined;
        const timer = setTimeout(function () {
            if (watcher){
                watcher.close();
            }
            reject(
                new TimeoutError(
                    `${moduleConsolePrefix}File "${filePath}" ` +
                    "did not exists and was not created during the timeout."));
        }, timeout);

        access(filePath, fs_constants.R_OK, function (err) {
            if (!err) {
                clearTimeout(timer);
                if (watcher){
                    watcher.close();
                }
                console.warn(`${moduleConsolePrefix}File "${filePath}" already exists`);
                resolve();
            }
        });

        const dir = path.dirname(filePath);
        const basename = path.basename(filePath);
        debug(`${moduleConsolePrefix}watching for file "${basename}" in dir ${dir}`);
        watcher = watch(dir, function (eventType, filename) {
            if (eventType === "rename" && filename === basename) {
                debug(`${moduleConsolePrefix}Detected file "${basename}" in dir ${dir}!`);
                clearTimeout(timer);
                if (watcher){
                    watcher.close();
                }
                resolve();
            }
        });
    });
}

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
function waitForProcessToBeKilled(
    processObject: ChildProcess, timeoutInput?: number|null|undefined,
    pollingIntervalInput?: number|null|undefined): Promise<void> {

    // Set defaults if values not provided
    const timeout: number = timeoutInput ?? 10000;
    const pollingInterval: number = pollingIntervalInput ?? 100;
    const pid = processObject.pid;

    /*
     * stop the service in the background if not in docker compose mode and the state
     * object has server_process object
     */
    if (processObject.kill()){
        debug(`${moduleConsolePrefix}Server process with PID ${pid} was killed`);
    }
    else{
        console.warn(`${moduleConsolePrefix}Server process with PID ${pid} was not killed`);
    }

    // Now wait for it to really be gone
    return new Promise<void>(function (resolve, reject) {
        debug(`${moduleConsolePrefix}Waiting for pid ${pid} to finish`);
        // Set max timeout
        let pollingTimer:NodeJS.Timeout|undefined = undefined;

        // Start the timer
        const maxTimeoutTimer:NodeJS.Timeout = setTimeout(
            ()=>{
                // unset the interval time if running
                if (pollingTimer) {
                    clearTimeout(pollingTimer);
                }

                // reject with timeout exception
                reject(
                    new TimeoutError(
                        `${moduleConsolePrefix}Timeout shutting down server process with pid ` +
                        `${pid}`));
            }, timeout);
        const pollingFunction = ()=>{
            // check if the exit code is set indicating the process has ended
            if(null!==processObject.exitCode){
                debug(
                    `${moduleConsolePrefix}Server process with pid ${pid} exitted with code` +
                    `${processObject.exitCode}`);

                // Disable the timeout timer and return positive
                clearTimeout(maxTimeoutTimer);
                resolve();
            }
            else{
                debug(`${moduleConsolePrefix}Still waiting for pid ${pid} to finish`);
                // restart the interval polling timer
                pollingTimer = setTimeout(pollingFunction, pollingInterval);
            }
        };
        // start the interval polling timer
        pollingTimer = setTimeout(pollingFunction, pollingInterval);
    });
}

/**
 * Delete a file if it exists, returning a promise to be resolved if the operation succeeds or
 * reject with an error if it fails
 *
 * @param  {string} targetFile The file to delete
 * @returns {Promise<boolean>} Promise to be resolved if the operation succeeds or reject with an
 *                             error if it fails; promise holds the boolean as to whether or not a
 *                             file was deleted
 */
function deleteFileIfExisted(targetFile: string): Promise<boolean> {
    let fileDidExist = false;

    /**
     * Check if we can see the file; throw an exception on some problem checking or the file doesnt
     * exist
     */
    try {
        accessSync(targetFile, fs_constants.F_OK);
        fileDidExist = true;
    } catch (err) {
        // eat the exception
    }

    // delete the file if it existed
    if(fileDidExist){
        debug(`${moduleConsolePrefix}Deleting ready file ${targetFile}`);

        /**
         * resolve with true value if the file is successfully deleted or reject with the exception
         * if there was an error
         */
        return new Promise<boolean>((resolve, reject) => {
            rm(
                targetFile,
                (err) => {
                    if(err){
                        reject(err);
                    }
                    resolve(true);
                });
        });
    }
    debug(`${moduleConsolePrefix}Ready file ${targetFile} did not exist`);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise<boolean>((resolve, reject) => { resolve(false); });
}

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
function waitForLogFileToContainString(
    logFile: PathOrFileDescriptor, stringToFind: string, timeoutInput?: number|null|undefined,
    pollingIntervalInput?: number|null|undefined,
    process_object?: ChildProcess|null|undefined) : Promise<void> {

    // Set defaults if values not provided
    const timeout: number = timeoutInput ?? 30000;
    const pollingInterval: number = pollingIntervalInput ?? 100;

    return new Promise<void>(function (resolve, reject) {
        debug(`${moduleConsolePrefix}Waiting for logfile to contain string`);
        // Set max timeout
        let pollingTimer:NodeJS.Timeout|undefined = undefined;
        // Start the timer
        const maxTimeoutTimer:NodeJS.Timeout = setTimeout(
            ()=>{
                // unset the interval time if running
                if (pollingTimer) {
                    clearTimeout(pollingTimer);
                }
                // kill the process if provided
                if (process_object) {
                    process_object.kill();
                }
                // reject with timeout exception
                reject(
                    new TimeoutError(
                        `${moduleConsolePrefix}Timeout waiting for logfile to contain string`));
            }, timeout);
        const pollingFunction = ()=>{
            let logContents: Buffer|undefined;
            try{
                // read the contents of the file
                logContents = readFileSync(logFile);
            } catch(err){
                // on error
                // kill the process if provided
                if (process_object) {
                    process_object.kill();
                }
                // reject with timeout exception
                reject(err);
            }
            
            // scan the contents of the file for the provided string
            if(logContents!==undefined && logContents.includes(stringToFind)){
                debug(`${moduleConsolePrefix}String found in logfile!`);
                // Disable the timeout timer and return positive
                clearTimeout(maxTimeoutTimer);
                resolve();
            }
            else{
                debug(`${moduleConsolePrefix}Still waiting for logfile to contain string`);
                // restart the interval polling timer
                pollingTimer = setTimeout(pollingFunction, pollingInterval);
            }
        };
        // start the interval polling timer
        pollingTimer = setTimeout(pollingFunction, pollingInterval);
    });
}

/**
 * Check if an object appears to implement the AxiosResponse interface
 *
 * @param  {unknown} maybeAxiosResponse The variable to evaluate as to whether or not implements
 *                                      the `AxiosResponse` interface
 * @returns {boolean} Whether of not the given variable represents and implememntation of the
 *                    `AxiosResponse` interface
 */
function isAxiosResponse(maybeAxiosResponse: unknown): maybeAxiosResponse is AxiosResponse {
    // check if unknown is an object
    if (!(maybeAxiosResponse instanceof Object)) {
        return false;
    }

    // Check if object has all the require properties/methods
    return "data" in maybeAxiosResponse && "status" in maybeAxiosResponse &&
        "statusText" in maybeAxiosResponse && "headers" in maybeAxiosResponse &&
        "config" in maybeAxiosResponse && "request" in maybeAxiosResponse;
}

/**
 * Spawn a process in the background with its I/O tied to the console
 *
 * @param  {string} command The command to execute
 * @param  {string[]} args Arguments to pass to the command
 * @param  {SpawnOptionsWithoutStdio|undefined} options Options to define process settings
 * @returns {ChildProcess} Object representing the newly spawned process
 */
function spawnWithConsoleIo(
    command: string, args?: string[],
    options?: SpawnOptionsWithoutStdio | undefined): ChildProcess {

    const process_object: ChildProcess = spawn(command, args, options);

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
    process_object.on(
        "close", 
        (code, signal) => {
            debug(
                `${moduleConsolePrefix}Server process terminated due to receipt of signal ` +
                `${signal}`);
        }
    );

    return process_object;
}

/**
 * Escape the given string so that it can be used safely within a regular expression
 * 
 * @param  {string} stringToEscape The string to be modified so that it can be used safely within a
 *                                 regular expression
 * @returns {string} The `stringToEscape` modified to escape control characters for the regular
 *                   expression engine
 */
function escapeStringRegexp(stringToEscape: string): string {
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

/**
 * Determine whether or not "dry-run" mode is enabled for the current codeceptj execution context
 * 
 * @returns {boolean} Whether or not the dryrun property is set to true in the codeceptjs store
 */
function isDryRun(): boolean {
    // Bail out if this is a dry
    const store = codeceptjs_store as CodeceptJSStore;
    if (store["dryRun"]) return true;

    return false;
}

/**
 * @property Regular expression object which will match issue tags
 */
const issueTagRegex = new RegExp(
    process.env.DEFAULT_ISSUE_REGEX ?? (
        process.env.DEFAULT_ISSUE_PREFIX ?
            "^" + escapeStringRegexp(process.env.DEFAULT_ISSUE_PREFIX) + "(.+)$" :
            "^@ISSUE:(.+)$"), "i");

/**
 * Remove existing tags that match the give tag patterns and replace them with allure tags so that
 * the allure report can accurately reflect the information they convey, such as issues associated
 * with a given feature or scenario
 * 
 * @param  {Mocha.Test} test The test to be modified
 */
function traslateAllureTagsForTest(test: Mocha.Test): void {
    const allurePlugin: CodeceptJSAllurePlugin = codeceptjs.container.plugins("allure");
    if (!allurePlugin){
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

    const testTags: string[] = test.tags;
    const nonIssueTags: string[] = [];
    const issueTags: string[] = [];
    const issueValues: string[] = [];
    testTags.forEach (
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (value: string, index: number, array: string[]) => {
            debug(
                `(${moduleConsolePrefix}Plugin cycling tags '${value}' on '${testTitle}'`);

            const matches = issueTagRegex.exec(value);
            if(null === matches || undefined === matches) {
                debug(
                    `(${moduleConsolePrefix}!! Plugin tag '${value}' didnt match on ` +
                    `'${testTitle}'`);
                nonIssueTags.push(value);
                return;
            }
            debug(
                `(${moduleConsolePrefix}Plugin tag '${value}' has matches on '${testTitle}'`);
            /*const groups = matches.groups;
            if(null === groups || undefined === groups) {*/
            if(matches.length < 2) {
                debug(
                    `(${moduleConsolePrefix}!! Plugin tag '${value}' match has no groups on ` +
                    `'${testTitle}'`);
                nonIssueTags.push(value);
                return;
            }
            debug(
                `(${moduleConsolePrefix}Plugin tag '${value}' has match groups on '${testTitle}'`);
            //const issueValue = groups[1];
            const issueValue = matches[1];
            if(null === issueValue || undefined === issueValue) {
                nonIssueTags.push(value);
                return;
            }
            debug(
                `(${moduleConsolePrefix}Plugin found tag '${value}' value '${issueValue}' on ` +
                `'${testTitle}'`);
            issueTags.push(value);
            issueValues.push(issueValue);
        }
    );

    // Remove any tags matching our pattern from the list of normal tags
    test.tags = nonIssueTags;

    // convert tags matching the pattern to allure issu tags
    issueValues.forEach (
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (value: string, index: number, array: string[]) => {
            debug(
                `(${moduleConsolePrefix}Plugin adding issue '${value}' on '${testTitle}'`);

            allurePlugin.issue(value);
        }
    );

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
function addAllureFileAttachmentToTest(
    filePath: string, mimeType: string, desiredFileName?: string): void {

    const targetFileName:string = desiredFileName ?? path.basename(filePath);
    const fileContents:Buffer = readFileSync(filePath);

    addAllureAttachmentToTest(
        targetFileName, fileContents, mimeType);
}

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
function addAllureAttachmentToTest(
    desiredFileName: string, fileContents:Buffer, mimeType: string): void {

    const allurePlugin: CodeceptJSAllurePlugin = codeceptjs.container.plugins("allure");
    if (!allurePlugin){
        return;
    }

    debug(
        `(${moduleConsolePrefix}Adding attchment '${desiredFileName}' of type '${mimeType}' to ` +
        "current test");

    allurePlugin.addAttachment(desiredFileName, fileContents, mimeType);
}

export {
    allureCli, cleanDir, generateAllureReport, setModuleConsolePrefix, checkExistsWithTimeout,
    waitForProcessToBeKilled, deleteFileIfExisted, waitForLogFileToContainString, isAxiosResponse,
    spawnWithConsoleIo, escapeStringRegexp, isDryRun, issueTagRegex, traslateAllureTagsForTest,
    addAllureAttachmentToTest, addAllureFileAttachmentToTest
};