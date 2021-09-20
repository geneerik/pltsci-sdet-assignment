import * as path from "path";
import { emptyDirSync } from "fs-extra";
import { spawnSync, SpawnOptions, StdioOptions } from "child_process";
import { config as codeceptjs_config } from "codeceptjs";

interface NullableLooseObject {
    [key: string]: string | null
}
/**
 * Spawn and instance of the allure cli program for gnerating reports
 * 
 * @param  {string[]} args
 * @param  {NullableLooseObject} appendEnv?
 * @param  {string} cwd?
 * @param  {number} timeout?
  */
function allureCli(args:string[], appendEnv?:NullableLooseObject, cwd?:string, timeout?:number) {
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
 * Empty out an existing directory if it has contents
 *
 * @param  {string} dirPath
 */
function cleanDir (dirPath:string) {
    if (!dirPath) {
        throw Error("Dir path to clean is not defined");
    }

    const targetDir = path.isAbsolute(dirPath)?dirPath:path.join(process.cwd(), dirPath);

    console.log(`cleaning dir "${targetDir}" ...`);

    emptyDirSync(targetDir);
}

/**
 * Generate Allure Report
 *
 * @param {{reportOutputDir?:string, shouldGenerateReport?:boolean}} options
 */
function reportGenerator(options: {reportOutputDir?:string, shouldGenerateReport?:boolean}) {
    const TEST_OUTPUT_DIR = codeceptjs_config.get("output") ?? "./output";
    const REPORT_OUTPUT_DIR = codeceptjs_config.get("report_output") ?? "./report";

    const reportOutputDir = options.reportOutputDir ?? REPORT_OUTPUT_DIR;
    const testOutputDir = options.reportOutputDir ?? TEST_OUTPUT_DIR;
    const shouldGenerateReport = options.shouldGenerateReport ?? true;

    const destinationDir = 
        path.isAbsolute(reportOutputDir)?reportOutputDir:path.join(process.cwd(), reportOutputDir);

    const xunitOutputDir = 
        path.isAbsolute(testOutputDir)?testOutputDir:path.join(process.cwd(), testOutputDir);

    // generate launcher
    if (shouldGenerateReport) {
        console.log("*** making report now");
        
        allureCli(
            [
                "-v",
                "generate", "--report-dir", destinationDir, xunitOutputDir],
            {
                ALLURE_OPTS: 
                    codeceptjs_config.get("allure_issue_tracker_pattern") ? 
                        "-Dallure.issues.tracker.pattern=" + 
                            codeceptjs_config.get("allure_issue_tracker_pattern") :
                        ""
            },                             
            undefined,
            30000);

        console.log(`Allure reports generated in "${destinationDir}" ...`);
    }
}

module.exports = {
    bootstrap: () => {
        //console.log("#$%^ imported bootstrap is called");
        cleanDir(codeceptjs_config.get("output") ?? "./output");
        cleanDir(codeceptjs_config.get("report_output") ?? "./report");
    },
    teardown: () => {
        //console.log("#$%^ imported teardown is called");
        reportGenerator({ shouldGenerateReport: true });

        //console.log("#$%^ imported teardown is done");
    },
    bootstrapAll: () => {
        //console.log("#$%^ imported bootstrapAll is called");
    },
    teardownAll: () => {
        //console.log("#$%^ imported teardownAll is called");
    }
};