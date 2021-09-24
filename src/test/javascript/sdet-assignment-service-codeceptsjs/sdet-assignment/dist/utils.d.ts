/// <reference types="node" />
import { NullableLooseObject } from "./interfaces";
import { PathOrFileDescriptor } from "fs-extra";
import { ChildProcess, SpawnOptionsWithoutStdio } from "child_process";
import { AxiosResponse } from "axios";
/**
 * Setter to the set a prefix for all messages sent from this module.  Useful when running in
 * multiple threads or processes
 *
 * @param  {string} newPrefixValue String to prefix the message with
 * @returns {void}
 */
declare function setModuleConsolePrefix(newPrefixValue: string): void;
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
declare function allureCli(args: string[], appendEnv?: NullableLooseObject, cwd?: string, timeout?: number): void;
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
declare function generateAllureReport(testOutputDir?: string, reportOutputDir?: string, issueTrackerPattern?: string, shouldGenerateReport?: boolean, verboseInput?: boolean, timeoutInput?: number): void;
/**
 * Empty out an existing directory if it has contents
 *
 * @param  {string} dirPath The directory whose contents will be removed
 * @returns {void}
 */
declare function cleanDir(dirPath: string): void;
/**
 * Wait for a file to exist
 *
 * @param  {string} filePath The path to the file to be waited for
 * @param  {number|undefined} timeout Time to wait for file to exist in milliseconds
 * @returns {Promise} Promise to ensure the string exists in the file or throw a timeout exception
 */
declare function checkExistsWithTimeout(filePath: string, timeout: number | undefined): Promise<void>;
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
declare function waitForProcessToBeKilled(processObject: ChildProcess, timeoutInput?: number | null | undefined, pollingIntervalInput?: number | null | undefined): Promise<void>;
/**
 * Delete a file if it exists, returning a promise to be resolved if the operation succeeds or
 * reject with an error if it fails
 *
 * @param  {string} targetFile The file to delete
 * @returns {Promise<boolean>} Promise to be resolved if the operation succeeds or reject with an
 *                             error if it fails; promise holds the boolean as to whether or not a
 *                             file was deleted
 */
declare function deleteFileIfExisted(targetFile: string): Promise<boolean>;
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
declare function waitForLogFileToContainString(logFile: PathOrFileDescriptor, stringToFind: string, timeoutInput?: number | null | undefined, pollingIntervalInput?: number | null | undefined, process_object?: ChildProcess | null | undefined): Promise<void>;
/**
 * Check if an object appears to implement the AxiosResponse interface
 *
 * @param  {unknown} maybeAxiosResponse The variable to evaluate as to whether or not implements
 *                                      the `AxiosResponse` interface
 * @returns {boolean} Whether of not the given variable represents and implememntation of the
 *                    `AxiosResponse` interface
 */
declare function isAxiosResponse(maybeAxiosResponse: unknown): maybeAxiosResponse is AxiosResponse;
/**
 * Spawn a process in the background with its I/O tied to the console
 *
 * @param  {string} command The command to execute
 * @param  {string[]} args Arguments to pass to the command
 * @param  {SpawnOptionsWithoutStdio|undefined} options Options to define process settings
 * @returns {ChildProcess} Object representing the newly spawned process
 */
declare function spawnWithConsoleIo(command: string, args?: string[], options?: SpawnOptionsWithoutStdio | undefined): ChildProcess;
export { allureCli, cleanDir, generateAllureReport, setModuleConsolePrefix, checkExistsWithTimeout, waitForProcessToBeKilled, deleteFileIfExisted, waitForLogFileToContainString, isAxiosResponse, spawnWithConsoleIo };
