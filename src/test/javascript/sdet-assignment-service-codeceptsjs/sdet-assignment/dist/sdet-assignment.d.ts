import { NullableLooseObject } from "./interfaces";
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
export { allureCli, cleanDir, generateAllureReport };
