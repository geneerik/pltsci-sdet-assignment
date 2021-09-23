import { NullableLooseObject } from "./interfaces";
import { TimeoutError } from "./exceptions";
import * as path from "path";
import {
    access, watch, FSWatcher, constants as fs_constants, emptyDirSync,
    accessSync, PathOrFileDescriptor, readFileSync } from "fs-extra";
import { rm } from "fs";
import { spawnSync, SpawnOptions, StdioOptions, ChildProcess } from "child_process";

let moduleConsolePrefix = "";

function setModuleConsolePrefix(newPrefixValue: string): void {
    moduleConsolePrefix = newPrefixValue;
}

/**
 * Spawn and instance of the allure cli program for gnerating reports
 * 
 * @param  {string[]} args
 * @param  {NullableLooseObject} appendEnv?
 * @param  {string} cwd?
 * @param  {number} timeout?
  */
function allureCli(
    args:string[], appendEnv?:NullableLooseObject, cwd?:string, timeout?:number): void {
        
    const allure_commandline_module_path = require.resolve("allure-commandline");
    const allure_commandline_module_dirname = path.dirname(allure_commandline_module_path);
    const isWindows = path.sep === "\\";
    const allureCommand = "allure" + (isWindows ? ".bat" : "");
    const allure_binary_path =
        path.join(allure_commandline_module_dirname, "dist/bin", allureCommand);

    console.debug(`${moduleConsolePrefix}Allure commandline binary path: ${allure_binary_path}`);

    // Copy the process env so we can append to the child process env
    const envCopy: NullableLooseObject =
        Object.assign({}, process.env, appendEnv ?? {});

    const allureSpawnStioOpts: StdioOptions = [
        "inherit",
        "inherit",
        "inherit"
    ];

    const allureSpawnOpts: SpawnOptions = {
        cwd: cwd,    
        env: envCopy,
        stdio: allureSpawnStioOpts,
        timeout: timeout
    };

    spawnSync(allure_binary_path, args, allureSpawnOpts);
}

/**
 * Generate Allure Report
 * 
 * @param  {string} testOutputDir?
 * @param  {string} reportOutputDir?
 * @param  {string} issueTrackerPattern?
 * @param  {boolean} shouldGenerateReport?
 * @returns void
 */
function generateAllureReport(
    testOutputDir?:string, reportOutputDir?:string, issueTrackerPattern?:string,
    shouldGenerateReport?:boolean): void {

    const resolvedTestOutputDir = testOutputDir ?? "./output";
    const resolvedReportOutputDir = reportOutputDir ?? "./report";
    const resolvedShouldGenerateReport = shouldGenerateReport ?? true;

    const destinationDir = 
        path.isAbsolute(resolvedReportOutputDir) ?
            resolvedReportOutputDir :
            path.join(process.cwd(), resolvedReportOutputDir);

    const xunitOutputDir = 
        path.isAbsolute(resolvedTestOutputDir) ?
            resolvedTestOutputDir :
            path.join(process.cwd(), resolvedTestOutputDir);

    // generate launcher
    if (resolvedShouldGenerateReport) {
        console.info(`${moduleConsolePrefix}Making report now`);
        
        allureCli(
            [
                // "-v",
                "generate", "--report-dir", destinationDir, xunitOutputDir],
            {
                ALLURE_OPTS: 
                    issueTrackerPattern ?
                        `-Dallure.issues.tracker.pattern=${issueTrackerPattern}` :
                        ""
            },                             
            undefined,
            30000);

        console.info(`${moduleConsolePrefix}Allure reports generated in "${destinationDir}" ...`);
    }
}

/**
 * Empty out an existing directory if it has contents
 *
 * @param  {string} dirPath
 */
function cleanDir (dirPath:string): void {
    if (!dirPath) {
        throw Error("Dir path to clean is not defined");
    }

    const targetDir = path.isAbsolute(dirPath) ?
        dirPath :
        path.join(process.cwd(), dirPath);

    console.info(`${moduleConsolePrefix}cleaning dir "${targetDir}" ...`);

    emptyDirSync(targetDir);
}

/**
 * Wait for a file to exist
 * 
 * @param  {string} filePath The path to the file to be waited for
 * @param  {number|undefined} timeout Time to wait for file to exist in milliseconds
 * @returns Promise
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
        console.debug(`${moduleConsolePrefix}watching for file "${basename}" in dir ${dir}`);
        watcher = watch(dir, function (eventType, filename) {
            if (eventType === "rename" && filename === basename) {
                console.debug(`${moduleConsolePrefix}Detected file "${basename}" in dir ${dir}!`);
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
 * @param  {number|null|undefined} timeoutInput? The maximum amount of time in milliseconds to
 *                                               wait for the process to end before throwing an
 *                                               exception
 * @param  {number|null|undefined} pollingIntervalInput? The interval in milliseconds after which
 *                                                       to poll to check if the process has ended
 * @returns Promise to ensure process is killed or throw a timeout exception
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
        console.debug(`${moduleConsolePrefix}Server process with PID ${pid} was killed`);
    }
    else{
        console.warn(`${moduleConsolePrefix}Server process with PID ${pid} was not killed`);
    }

    // Now wait for it to really be gone
    return new Promise<void>(function (resolve, reject) {
        console.debug(`${moduleConsolePrefix}Waiting for pid ${pid} to finish`);
        // Set max timeout
        let pollingTimer:NodeJS.Timeout|undefined = undefined;

        // Start the timer
        const maxTimeoutTimer:NodeJS.Timeout = setTimeout(
            ()=>{
                if (pollingTimer) {
                    // Shut down the interval timer
                    clearTimeout(pollingTimer);
                }

                reject(
                    new TimeoutError(
                        `${moduleConsolePrefix}Timeout shutting down server process with pid ` +
                        `${pid}`));
            }, timeout);
        const pollingFunction = ()=>{
            // check if the exit code is set indicating the process has ended
            if(null!==processObject.exitCode){
                console.debug(
                    `${moduleConsolePrefix}Server process with pid ${pid} exitted with code` +
                    `${processObject.exitCode}`);

                // Disable the timeout timer and return positive
                clearTimeout(maxTimeoutTimer);
                resolve();
            }
            else{
                console.debug(`${moduleConsolePrefix}Still waiting for pid ${pid} to finish`);
                pollingTimer = setTimeout(pollingFunction, pollingInterval);
            }
        };
        pollingTimer = setTimeout(pollingFunction, pollingInterval);
    });
}

/**
 * Delete a file if it exists, returning a promise to be resolved if the operation succeeds or
 * reject with an error if it fails
 * 
 * @param  {string} targetFile The file to delete
 * @returns Promise to be resolved if the operation succeeds or reject with an error if it fails
 */
function deleteFileIfExisted(targetFile: string): Promise<boolean> {
    let fileDidExist = false;

    try {
        accessSync(targetFile, fs_constants.F_OK);
        fileDidExist = true;
    } catch (err) {
        // eat the exception
    }

    // delete the file if it existed
    if(fileDidExist){
        console.debug(`${moduleConsolePrefix}Deleting ready file ${targetFile}`);

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
    console.debug(`${moduleConsolePrefix}Ready file ${targetFile} did not exist`);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise<boolean>((resolve, reject) => { resolve(false); });
}

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
function waitForLogFileToContainString(
    logFile: PathOrFileDescriptor, stringToFind: string, timeoutInput?: number|null|undefined,
    pollingIntervalInput?: number|null|undefined,
    process_object?: ChildProcess|null|undefined) : Promise<void> {

    // Set defaults if values not provided
    const timeout: number = timeoutInput ?? 30000;
    const pollingInterval: number = pollingIntervalInput ?? 100;

    return new Promise<void>(function (resolve, reject) {
        console.debug(`${moduleConsolePrefix}Waiting for logfile to contain string`);
        // Set max timeout
        let pollingTimer:NodeJS.Timeout|undefined = undefined;
        // Start the timer
        const maxTimeoutTimer:NodeJS.Timeout = setTimeout(
            ()=>{
                if (pollingTimer) {
                    clearTimeout(pollingTimer);
                }
                if (process_object) {
                    process_object.kill();
                }
                reject(
                    new TimeoutError(
                        `${moduleConsolePrefix}Timeout waiting for logfile to contain string`));
            }, timeout);
        const pollingFunction = ()=>{
            let logContents: Buffer|undefined;
            try{
                logContents = readFileSync(logFile);
            } catch(err){
                if (process_object) {
                    process_object.kill();
                }
                reject(err);
            }
            
            if(logContents!==undefined && logContents.includes(stringToFind)){
                console.debug(`${moduleConsolePrefix}String found in logfile!`);
                clearTimeout(maxTimeoutTimer);
                resolve();
            }
            else{
                console.debug(`${moduleConsolePrefix}Still waiting for logfile to contain string`);
                pollingTimer = setTimeout(pollingFunction, pollingInterval);
            }
        };
        pollingTimer = setTimeout(pollingFunction, pollingInterval);
    });
}

export {
    allureCli, cleanDir, generateAllureReport, setModuleConsolePrefix, checkExistsWithTimeout,
    waitForProcessToBeKilled, deleteFileIfExisted, waitForLogFileToContainString
};