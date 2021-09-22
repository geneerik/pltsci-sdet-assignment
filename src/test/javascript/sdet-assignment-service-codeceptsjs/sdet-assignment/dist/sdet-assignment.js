"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAllureReport = exports.cleanDir = exports.allureCli = void 0;
const path = require("path");
const fs_extra_1 = require("fs-extra");
const child_process_1 = require("child_process");
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
    console.debug(`Allure commandline binary path: ${allure_binary_path}`);
    // Copy the process env so we can append to the child process env
    const envCopy = {};
    for (const e in process.env) {
        const envVal = process.env[e];
        envCopy[e] = envVal ? envVal : null;
    }
    // Override with requested env settings
    if (appendEnv) {
        for (const e in appendEnv) {
            const envVal = appendEnv[e];
            envCopy[e] = envVal !== null && envVal !== void 0 ? envVal : null;
        }
    }
    const allureSpawnStioOpts = [
        "inherit",
        "inherit",
        "inherit"
    ];
    const allureSpawnOpts = {
        cwd: cwd,
        env: process.env,
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
        console.info("*** Making report now");
        allureCli([
            // "-v",
            "generate", "--report-dir", destinationDir, xunitOutputDir
        ], {
            ALLURE_OPTS: issueTrackerPattern ?
                `-Dallure.issues.tracker.pattern=${issueTrackerPattern}` :
                ""
        }, undefined, 30000);
        console.log(`Allure reports generated in "${destinationDir}" ...`);
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
    const targetDir = path.isAbsolute(dirPath) ? dirPath : path.join(process.cwd(), dirPath);
    console.log(`cleaning dir "${targetDir}" ...`);
    (0, fs_extra_1.emptyDirSync)(targetDir);
}
exports.cleanDir = cleanDir;
