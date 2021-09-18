import * as path from "path";
import { emptyDirSync } from "fs-extra";
import { execFileSync, ExecFileSyncOptions, spawnSync, SpawnOptions, StdioOptions } from "child_process";
import { Writable } from "stream";

// TODO: these values need to be read from the codecept.conf.js file
const TEST_OUTPUT_DIR = './test_output/output';
const REPORT_OUTPUT_DIR = './test_output/report';

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
    const allure_binary_path = path.join(allure_commandline_module_dirname, "dist/bin", allureCommand)

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
            envCopy[e] = envVal?envVal:null;
        }
    }

    var grabber = new Writable();

    grabber._write = function(chunk, enc, done) {
        console.log('Chunk:');
        console.log(String(chunk));
        done();
    };
    

    const a:StdioOptions = [
        "inherit",
        "inherit",
        "inherit"
    ];
    const allure_spawn_opts:SpawnOptions = {
        cwd: cwd,    
        env: process.env,
        stdio: a,
        timeout: timeout
    };

    spawnSync(allure_binary_path, args, allure_spawn_opts);
}

/**
 * Empty out an existing directory if it has contents
 *
 * @param  {string} dirPath
 */
function cleanDir (dirPath:string) {
    if (!dirPath) {
        throw Error('Dir path to clean is not defined');
    }

    const targetDir = path.isAbsolute(dirPath)?dirPath:path.join(process.cwd(), dirPath);

    console.log(`cleaning dir "${targetDir}" ...`);

    emptyDirSync(targetDir);
};

// TODO: package this (and other stuff) so we dont have to repeat the definition
class TimeoutError extends Error {}

/**
 * Generate Allure Report
 *
 * @param {{reportOutputDir?:string, shouldGenerateReport?:boolean}} options
 */
function reportGenerator(options: {reportOutputDir?:string, shouldGenerateReport?:boolean}) {
    const destinationDir = 
        options.reportOutputDir?
            (path.isAbsolute(options.reportOutputDir)?options.reportOutputDir:path.join(process.cwd(), options.reportOutputDir)):
            path.join(process.cwd(), REPORT_OUTPUT_DIR);

    // generate launcher
    if (options.shouldGenerateReport) {
        console.log("*** making report now");
        
        allureCli(
            [
                "-v",
                "generate", "--report-dir", destinationDir, TEST_OUTPUT_DIR],
            {
                // TODO: make this NOT hardcoded
                ALLURE_OPTS: "-Dallure.link.mylink.pattern=https://example.org/mylink/{} " +
                             "-Dallure.link.issue.pattern=https://github.com/geneerik/pltsci-sdet-assignment-unittests/issue/{} " +
                             "-Dallure.link.tms.pattern=https://example.org/tms/{} " +
                             "-Dallure.issues.tracker.pattern=https://github.com/geneerik/pltsci-sdet-assignment-unittests/issue/%s"},
            undefined,
            30000);

        console.log(`Allure reports generate in "${destinationDir}" ...`);
    }
}

module.exports = {
    bootstrap: () => {
        //console.log("#$%^ imported bootstrap is called");
        cleanDir(TEST_OUTPUT_DIR);
        cleanDir(REPORT_OUTPUT_DIR);
    },
    teardown: () => {
        //console.log("#$%^ imported teardown is called");
        reportGenerator({ reportOutputDir: REPORT_OUTPUT_DIR, shouldGenerateReport: true });

        //console.log("#$%^ imported teardown is done");
    },
    bootstrapAll: () => {
        //console.log("#$%^ imported bootstrapAll is called");
    },
    teardownAll: () => {
        //console.log("#$%^ imported teardownAll is called");
    }  
}