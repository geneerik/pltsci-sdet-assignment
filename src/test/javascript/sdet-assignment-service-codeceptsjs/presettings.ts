import { config as codeceptjs_config } from "codeceptjs";
import { threadId } from "worker_threads";
import { Debugger, debug as debugLoggerFactory } from "debug";
import { cleanDir, generateAllureReport, setModuleConsolePrefix } from "sdet-assignment";

/**
 * @property {Debugger} debug Debug logger method
 */
const debug: Debugger = debugLoggerFactory("com.geneerik.sdet-assignment.presettings");

/**
 * Function to hold the actions to perform on first start
 *
 * @returns {void}
 */
function bootStrapStuff(): void {
    cleanDir(codeceptjs_config.get("output") ?? "./output");
    cleanDir(codeceptjs_config.get("report_output") ?? "./report");
}

/**
 * Wrapper for the generateAllureReport method populationg values from the config file
 *
 * @returns {void}
 */
function generateAllureReportUsingConfig(): void {
    const TEST_OUTPUT_DIR = codeceptjs_config.get("output") ?? "./output";
    const REPORT_OUTPUT_DIR = codeceptjs_config.get("report_output") ?? "./report";
    const ISSUE_TRACKER_PATTERN = codeceptjs_config.get("allure_issue_tracker_pattern") ?? "";

    generateAllureReport(TEST_OUTPUT_DIR, REPORT_OUTPUT_DIR, ISSUE_TRACKER_PATTERN, true);
}

/**
 * Function to hold the actions to perform on final shutdown
 *
 * @returns {void}
 */
function tearDownStuff(): void {
    generateAllureReportUsingConfig();
}

module.exports = {
    bootstrap: () => {
        // debug(`(${threadId}) imported bootstrap is called`);
        if(!threadId){
            bootStrapStuff();
        }
        setModuleConsolePrefix(`(${threadId}) `);
    },
    teardown: () => {
        debug(`(${threadId}) imported teardown is called`);
        if(!threadId){
            tearDownStuff();
        }
        // debug(`(${threadId})  imported teardown is done`);
    },
    bootstrapAll: () => {
        debug(`(${threadId}) imported bootstrapAll is called`);
        bootStrapStuff();
    },
    teardownAll: () => {
        // debug(`(${threadId})  imported teardownAll is called`);
        tearDownStuff();
    }
};