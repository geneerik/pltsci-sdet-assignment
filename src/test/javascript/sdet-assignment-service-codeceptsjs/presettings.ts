import {} from "path";
import { emptyDirSync } from "fs-extra";
import path from "path/posix";
import { ChildProcess, spawn } from "child_process";

const TEST_OUTPUT_DIR = './output';
const REPORT_OUTPUT_DIR = './report';

interface NullableLooseObject {
    [key: string]: string | null
}

const allureCli = function (args:string[], appendEnv?:NullableLooseObject, cwd?:string, timeout?:number) : ChildProcess {
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

    return spawn(
        allure_binary_path, args, {
            cwd: cwd,    
            env: process.env,
            stdio: 'inherit',
            timeout: timeout
        });
}

const cleanDir = function (options: {path:string}) {
    if (!options.path) {
        throw Error('Dir path to clean is not defined');
    }

    const targetDir = path.isAbsolute(options.path)?options.path:path.join(process.cwd(), options.path);

    console.log(`cleaning dir "${targetDir}" ...`);

    emptyDirSync(targetDir);
};

/**
 * Collect Allure Report to one location, with date-time stamp
 *
 */
function reportGenerator(options: {reportOutputDir?:string, shouldGenerateReport?:boolean}) {
    const destinationDir = 
        options.reportOutputDir?
            (path.isAbsolute(options.reportOutputDir)?options.reportOutputDir:path.join(process.cwd(), options.reportOutputDir)):
            path.join(process.cwd(), REPORT_OUTPUT_DIR);
    

    // generate launcher
    if (options.shouldGenerateReport) {
        console.log("*** making report now");
        
        const allure_proc = allureCli(
            ["generate", "--report-dir", destinationDir, "output"],
            {
                ALLURE_OPTS: "-Dallure.link.mylink.pattern=https://example.org/mylink/{} " +
                             "-Dallure.link.issue.pattern=https://github.com/geneerik/pltsci-sdet-assignment-unittests/issue/{} " +
                             "-Dallure.link.tms.pattern=https://example.org/tms/{} " +
                             "-Dallure.issues.tracker.pattern=https://github.com/geneerik/pltsci-sdet-assignment-unittests/issue/%s"},
            undefined,
            30000);
    }

    console.log(`Allure reports are collected at "${destinationDir}" ...`);
}

module.exports = {
    bootstrap: () => {
        //console.log("#$%^ imported bootstrap is called");
        cleanDir({ path: TEST_OUTPUT_DIR });
        cleanDir({ path: REPORT_OUTPUT_DIR });
    },
    teardown: function() {
        //console.log("#$%^ imported teardown is called");
        reportGenerator({ reportOutputDir: REPORT_OUTPUT_DIR, shouldGenerateReport: true });
    },
    bootstrapAll: function() {
        //console.log("#$%^ imported bootstrapAll is called");
    },
    teardownAll: function() {
        //console.log("#$%^ imported teardownAll is called");
    }  
}