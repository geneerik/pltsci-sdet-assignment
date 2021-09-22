import { config as codeceptjs_config } from "codeceptjs";
import { threadId } from "worker_threads";
import { cleanDir, generateAllureReport } from "sdet-assignment";

/**
 * Function to hold the actions to perform on first start
 */
function bootStrapStuff() {
    cleanDir(codeceptjs_config.get("output") ?? "./output");
    cleanDir(codeceptjs_config.get("report_output") ?? "./report");
}

/**
 * Wrapper for the generateAllureReport method populationg values from the config file
 */
function generateAllureReportUsingConfig() {
    const TEST_OUTPUT_DIR = codeceptjs_config.get("output") ?? "./output";
    const REPORT_OUTPUT_DIR = codeceptjs_config.get("report_output") ?? "./report";
    const ISSUE_TRACKER_PATTERN = codeceptjs_config.get("allure_issue_tracker_pattern") ?? "";

    generateAllureReport(TEST_OUTPUT_DIR, REPORT_OUTPUT_DIR, ISSUE_TRACKER_PATTERN, true);
}

/**
 * Function to hold the actions to perform on final shutdown
 */
function tearDownStuff() {
    generateAllureReportUsingConfig();
}

module.exports = {
    bootstrap: () => {
        // console.debug(`(${threadId}) imported bootstrap is called`);
        if(!threadId){
            bootStrapStuff();
        }
    },
    teardown: () => {
        console.debug(`(${threadId}) imported teardown is called`);
        if(!threadId){
            tearDownStuff();
        }
        // console.debug(`(${threadId})  imported teardown is done`);
    },
    bootstrapAll: () => {
        console.debug(`(${threadId})  imported bootstrapAll is called`);
        bootStrapStuff();
    },
    teardownAll: () => {
        // console.debug(`(${threadId})  imported teardownAll is called`);
        tearDownStuff();
    }
};