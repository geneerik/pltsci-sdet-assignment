import { NullableLooseObject } from "./interfaces";
import * as path from "path";
import { emptyDirSync } from "fs-extra";
import { spawnSync, SpawnOptions, StdioOptions } from "child_process";

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

    console.debug(`Allure commandline binary path: ${allure_binary_path}`);

    // Copy the process env so we can append to the child process env
    const envCopy:NullableLooseObject = {};
    for (const e in process.env){
        const envVal = process.env[e];
        envCopy[e] = envVal?envVal:null;
    }
    // Override with requested env settings
    if (appendEnv) {
        for (const e in appendEnv){
            const envVal = appendEnv[e];
            envCopy[e] = envVal ?? null;
        }
    }

    const allureSpawnStioOpts:StdioOptions = [
        "inherit",
        "inherit",
        "inherit"
    ];

    const allureSpawnOpts:SpawnOptions = {
        cwd: cwd,    
        env: process.env,
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
        console.info("*** Making report now");
        
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

        console.log(`Allure reports generated in "${destinationDir}" ...`);
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

    const targetDir = path.isAbsolute(dirPath)?dirPath:path.join(process.cwd(), dirPath);

    console.log(`cleaning dir "${targetDir}" ...`);

    emptyDirSync(targetDir);
}

export {allureCli, cleanDir, generateAllureReport};