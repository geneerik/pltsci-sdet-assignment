/// <reference types="node" />
import { NullableLooseObject } from "./interfaces";
import { PathOrFileDescriptor } from "fs-extra";
import { ChildProcess } from "child_process";
declare function setModuleConsolePrefix(newPrefixValue: string): void;
/**
 * Spawn and instance of the allure cli program for gnerating reports
 *
 * @param  {string[]} args
 * @param  {NullableLooseObject} appendEnv?
 * @param  {string} cwd?
 * @param  {number} timeout?
  */
declare function allureCli(args: string[], appendEnv?: NullableLooseObject, cwd?: string, timeout?: number): void;
/**
 * Generate Allure Report
 *
 * @param  {string} testOutputDir?
 * @param  {string} reportOutputDir?
 * @param  {string} issueTrackerPattern?
 * @param  {boolean} shouldGenerateReport?
 * @returns void
 */
declare function generateAllureReport(testOutputDir?: string, reportOutputDir?: string, issueTrackerPattern?: string, shouldGenerateReport?: boolean): void;
/**
 * Empty out an existing directory if it has contents
 *
 * @param  {string} dirPath
 */
declare function cleanDir(dirPath: string): void;
/**
 * Wait for a file to exist
 *
 * @param  {string} filePath The path to the file to be waited for
 * @param  {number|undefined} timeout Time to wait for file to exist in milliseconds
 * @returns Promise
 */
declare function checkExistsWithTimeout(filePath: string, timeout: number | undefined): Promise<void>;
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
declare function waitForProcessToBeKilled(processObject: ChildProcess, timeoutInput?: number | null | undefined, pollingIntervalInput?: number | null | undefined): Promise<void>;
/**
 * Delete a file if it exists, returning a promise to be resolved if the operation succeeds or
 * reject with an error if it fails
 *
 * @param  {string} targetFile The file to delete
 * @returns Promise to be resolved if the operation succeeds or reject with an error if it fails
 */
declare function deleteFileIfExisted(targetFile: string): Promise<boolean>;
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
declare function waitForLogFileToContainString(logFile: PathOrFileDescriptor, stringToFind: string, timeoutInput?: number | null | undefined, pollingIntervalInput?: number | null | undefined, process_object?: ChildProcess | null | undefined): Promise<void>;
export { allureCli, cleanDir, generateAllureReport, setModuleConsolePrefix, checkExistsWithTimeout, waitForProcessToBeKilled, deleteFileIfExisted, waitForLogFileToContainString };
