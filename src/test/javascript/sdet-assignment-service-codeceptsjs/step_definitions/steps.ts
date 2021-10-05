import { AxiosResponse } from "axios";
import path from "path";
import { SpawnOptionsWithoutStdio } from "child_process";
import { threadId } from "worker_threads";
import { Debugger, debug as debugLoggerFactory } from "debug";
import {
    TestState, ProcessInfoHolderObject, CodeceptJSAllurePlugin,
    CleaningResponseObject, CodeceptJSDataTable, checkExistsWithTimeout,
    NullableLooseObject, waitForProcessToBeKilled, deleteFileIfExisted,
    waitForLogFileToContainString, isAxiosResponse, ServerProcessSettings,
    CodeceptJSDataTableArgument, spawnWithConsoleIo, isDryRun } from "sdet-assignment";

/**
 * @property {Debugger} debug Debug logger method
 */
const debug: Debugger = debugLoggerFactory("com.geneerik.sdet-assignment.steps-definitions.steps");

// Make the I actor instance available in BDD calls
const { I } = inject();

/**
 * @property {TestState} state Variable to hold the currnet start as BDD operations procede
 */
let state: TestState = {
    request: {},
    response: {},
    server_process: null
};

/**
 * Function to get the settings for spawning the server process
 *
 * @param  {string} serverReadyFile The path to the file to set the server to log to
 * @returns {Promise<ServerProcessSettings>} Promise providing the settings object for spawning a
 *                                           server process
 */
async function getServerProcessSettings(serverReadyFile: string): Promise<ServerProcessSettings> {
    // Get the "server_port" for the server under test
    const server_port: number|null = await I.performSimpleActionGetServerPort();

    if (null === server_port) {
        throw new Error(`(${threadId}) Cannot start server process: server_port is null!`);
    }

    const server_debug_port: number|null = await I.performSimpleActionGetServerDebugPort();

    // Copy the process env and append variables to the child process env
    const envCopy: NullableLooseObject =
        Object.assign({}, process.env, {
            // Override with requested env settings
            SERVER_FLAGS:
                `-Dserver.port=${server_port} -Dlogging.file=${serverReadyFile}`,
            DEBUG_PORT: `${server_debug_port}`
        });

    // server process options
    const serverSpawnOpts: SpawnOptionsWithoutStdio = {
        env: envCopy
    };

    // get the absolute path to the server startup script
    const start_script_path = path.join(__dirname, "..", "start_server_locally.sh");

    return {
        execPath: start_script_path,
        spawnOpts: serverSpawnOpts
    };
}

/**
 * Start the server to test if it is not managed externally
 *
 * @param  {string} serverReadyFile The path to the file to set the server to log to
 * @returns {Promise<ProcessInfoHolderObject|null>} Promise to hold the process object for the
 *                                                  server under test if we are managing it
 */
async function conditionallyStartServerProcess(
    serverReadyFile: string): Promise<ProcessInfoHolderObject|null> {

    // bail if we are not managing the server process
    if(process.env.SERVER_IS_EXTERNAL!==undefined && 
        process.env.SERVER_IS_EXTERNAL=="true") {

        return null;
    }

    // Get the settings for the server process
    const serverProcessSettings = await getServerProcessSettings(serverReadyFile);

    debug(`(${threadId}) Starting server process`);

    // Save the process object for future management operations
    return {
        process_object: spawnWithConsoleIo(
            serverProcessSettings.execPath, [], serverProcessSettings.spawnOpts)
    };
}

/**
 * Make sure that the server to be tested is shutdown and restarted if we have the ability to do so
 *
 * @returns {Promise<ProcessInfoHolderObject|null>} Promise to hold the process object for the
 *                                                  server under test if we are managing it
 */
async function ensureServerFreshlyStarted(): Promise<ProcessInfoHolderObject|null> {
    // bail if we are not managing the server at all
    if(process.env.NO_SERVER_MANAGEMENT===undefined && process.env.NO_SERVER_MANAGEMENT=="true") {
        return null;
    }

    // Kill existing server process if we are managing it
    await ensureServerIsShutDown();

    // Look up the log file we are supposed to monitor
    const serverReadyFile =
        (process.env.SERVER_RESTART_TRIGGER_FILE ??
            `/usr/local/demo-app/logs/application-${threadId}.log`);

    await I.performSimpleActionSetLogFile(serverReadyFile);

    /**
     * delete the "ready" file if it exists; if the server process is external, this should
     * trigger a server restart
     */
    await deleteFileIfExisted(serverReadyFile);

    /**
     * start the service in the background if not in docker compose mode and update the
     * state.server_process object
     */
    const server_process_object = await conditionallyStartServerProcess(serverReadyFile);

    // wait for the log file to exist
    await checkExistsWithTimeout(serverReadyFile, 60000);

    // wait for message that the app has started
    await waitForLogFileToContainString(
        serverReadyFile, "Started AppRunner in ", null, null,
        server_process_object ?
            server_process_object.process_object :
            null);

    return server_process_object;
}

/**
 * Make sure that the server process is shut down if we are managing it
 *
 * @returns {Promise<void>}
 */
async function ensureServerIsShutDown(): Promise<void> {
    // bail if we are not managing the server at all
    if(process.env.NO_SERVER_MANAGEMENT===undefined && process.env.NO_SERVER_MANAGEMENT=="true") {
        return;
    }

    // Kill existing server process if we are managing it
    if((!process.env.SERVER_IS_EXTERNAL===undefined ||
                process.env.SERVER_IS_EXTERNAL!="true") &&
            state.server_process) {
        await waitForProcessToBeKilled(state.server_process.process_object);
    }

    // unset the server_process in the test state
    state.server_process = null;
}

/**
 * Append the data in the `patchesTable` to the existing request `patches` value. Initialize the
 * `patches` array first if not already established.
 *
 * @param  {CodeceptJSDataTable} patchesTable The datatable for the step from the Gherkin document
 * @returns {void}
 */
function appendDirtPatchesToRequest(patchesTable: CodeceptJSDataTable): void {
    // initalize the patches proeprty if needed
    if (!Object.prototype.hasOwnProperty.call(state.request, "patches") || 
                !Array.isArray(state.request.patches)){
        state.request.patches = [];
    }

    // ensure the patches property is an array
    if (!Array.isArray(state.request.patches)){
        throw new Error(
            "state.request.patches expected to be Array but is not. type " +
            `${typeof state.request.patches}`);
    }
    // Cast patches property to expected type
    const patches = state.request.patches as unknown[][];

    // parse the table by header
    const patchesTableParsed: CodeceptJSDataTableArgument = patchesTable.parse();

    // get an array of row objects with column headers as keys
    const patchesTableByHeader = patchesTableParsed.hashes();

    // Loop through rows
    for (const row of patchesTableByHeader) {
        // take values
        const width_units = Number(row.width_units);
        const height_units = Number(row.height_units);

        // append new array to existing array
        /**
         * if the strings converted to numbers dont match when returned to strings,
         * fallback to original value
         */
        patches.push([
            row.width_units == `${width_units}` ? width_units : row.width_units,
            row.height_units == `${height_units}` ? height_units : row.height_units,
        ]);
    }
}

/**
 * Function to hold actions to perform on suite shutdown
 *
 * @returns {Promise<void>}
 */
async function performAfterSuiteActions(): Promise<void> {
    // This will throw an exception if the service is not running
    debug(`(${threadId}) Start in afterSuite`);
    
    // Ensure the server process is shut down if we are managing it
    await ensureServerIsShutDown();

    debug(`(${threadId}) End afterSuite`);
}

Before(() => {
    /**
     * Don"t use this; it is limited due to the inability to execute async code.
     * Use Given in a Background block instead
     */
    // debug("BEFORE");
});

/**
 * Things to do before each test starts; when used with Background, the bdd callback chain is set
 * as mocha beforeeach method
 */
Given("I have freshly started hoover web server instance", async () => {
    // debug(">>> Start in given");

    // Bail out if this is a dry run
    if (isDryRun()){
        // Need this for the step to show up
        I.performSimpleAction(
            ()=>{
                debug(`(${threadId}) Dry run place holder`);
            }
        );
        return;
    }

    const restEndpoint = await I.performSimpleActionGetRestEndpoint();
    debug(`(${threadId}) Endpoint: ${restEndpoint}`);

    /**
     * ensure the server is freshly started if we can and track the server process if we are
     * managing it
     */
    const server_process_object: ProcessInfoHolderObject|null = await ensureServerFreshlyStarted();

    // reset the test data
    state = {
        request: {},
        response: {},
        server_process: server_process_object
    };

    // Set the actions that need to be done when the suite ends (shuts down)
    await I.setAfterSuite(async () => {
        await performAfterSuiteActions();
    });

    // debug("<<< End in given");
});

Given("the hoover web service running", async () => {
    // This will throw an exception if the service is not running
    await I.sendGetRequest("/v1/cleaning-sessions");
});

Given(
    "I have a room with {int} width units and {int} height units",
    async (x: number, y: number) => {

        // debug("** CONTROL!");
        const coords = [x, y];
        await I.performSimpleAction(()=>{
            state.request.roomSize = coords;
        });
    }
);

Given(
    "I supply raw room size parameter values of {word} width units and {word} height units",
    async (x: string, y: string) => {
        const coords = [JSON.parse(x), JSON.parse(y)];
        await I.performSimpleAction(()=>{
            state.request.roomSize = coords;
        });
    }
);

Given(
    "I have known issues {string}",
    async (knownIssuesList: string) => {
        const trimmedIssuesList = knownIssuesList.trim();
        if(trimmedIssuesList) {
            const allurePlugin: CodeceptJSAllurePlugin = codeceptjs.container.plugins("allure");

            if (!allurePlugin){
                return;
            }
            trimmedIssuesList.split(",").forEach(
                (issueId) => {
                    allurePlugin.issue(issueId);
                }
            );
        }
    } 
);

Given(
    "I have a hoover at coordinates {int} width units and {int} height units",
    async (x: number, y: number) => {

        const coords = [x, y];
        await I.performSimpleAction(()=>{
            state.request.coords = coords;
        });
    }
);

Given(
    "I supply raw hoover coordinates parameter values of {word} width units and {word} height " +
        "units",
    async (x: string, y: string) => {
        const coords = [JSON.parse(x), JSON.parse(y)];
        await I.performSimpleAction(()=>{
            state.request.coords = coords;
        });
    }
);

Given("I have no dirt to clean", async () => {
    await I.performSimpleAction(()=>{
        state.request.patches = [];
    });
});

Given(
    "I have dirt to clean at some coordinates",
    async (patchesTable: CodeceptJSDataTable) => {
    
        await I.performSimpleAction(()=>{
            appendDirtPatchesToRequest(patchesTable);
        });
    }
);

Given(
    "I supply some raw dirt patch coordinates parameter values of {word} width units and {word} " +
        "height units",
    async (x: string, y: string) => {
        const coords = [[JSON.parse(x), JSON.parse(y)]];
        await I.performSimpleAction(()=>{
            state.request.patches = coords;
        });
    }
);

When("I give cleaning instructions to move {word}", async (instructions: string) => {
    state.request.instructions = instructions;
    debug(`(${threadId}) Payload to send: >>>\n` + JSON.stringify(state.request) + "<<<");
    
    // execute REST call
    const res:AxiosResponse = await I.cleaningSessionsPost(state.request);

    state.response.actualResponse = res;
});

When("I give cleaning instructions to move {string}", async (instructions: string) => {
    state.request.instructions = instructions;
    debug(`(${threadId}) Payload to send: >>>\n` + JSON.stringify(state.request) + "<<<");
    
    // execute REST call
    const res:AxiosResponse = await I.cleaningSessionsPost(state.request);

    state.response.actualResponse = res;
});

When("I give no cleaning instructions", async () => {
    state.request.instructions = "";
    debug(`(${threadId}) Payload to send: >>>\n` + JSON.stringify(state.request) + "<<<");
    
    // execute REST call
    const res:AxiosResponse = await I.cleaningSessionsPost(state.request);

    state.response.actualResponse = res;
});

Then("I should see that total number of clean spots is {int}", async (patches: number) => {
    const expectedPatches = patches;

    // Bail out if this is a dry run
    if (isDryRun()){
        // Need this for the step to show up
        I.performSimpleAction(
            ()=>{
                debug(`(${threadId}) Dry run place holder`);
            }
        );
        return;
    }

    if (!isAxiosResponse(state.response.actualResponse)) {
        throw new Error();
    }

    const serverResponse = state.response.actualResponse as AxiosResponse;
    await I.assertToEqual(serverResponse.status, 200);
    const data: CleaningResponseObject = serverResponse.data;
    
    await I.assertObjectToHaveProperty(data, "patches");
    await I.assertToEqual(data.patches, expectedPatches);
});

Then(
    "I should see a hoover at coordinates {int} width units and {int} height units",
    async (x: number, y: number) => {

        const coords = [x, y];

        // Bail out if this is a dry run
        if (isDryRun()){
            // Need this for the step to show up
            I.performSimpleAction(
                ()=>{
                    debug(`(${threadId}) Dry run place holder`);
                }
            );
            return;
        }

        if (!isAxiosResponse(state.response.actualResponse)) {
            throw new Error(
                "Response object expected to implement AxiosResponse interface, but did not");
        }

        const serverResponse = state.response.actualResponse as AxiosResponse;
        await I.assertToEqual(serverResponse.status, 200);
        const data: CleaningResponseObject = serverResponse.data;
        
        await I.assertObjectToHaveProperty(data, "coords");
        await I.assertToEqual(data.coords, coords);
    }
);

Then(
    "I should see a response from the server indicating it handled an error",
    async () => {

        // Bail out if this is a dry run
        if (isDryRun()){
            // Need this for the step to show up
            I.performSimpleAction(
                ()=>{
                    debug(`(${threadId}) Dry run place holder`);
                }
            );
            return;
        }

        if (!isAxiosResponse(state.response.actualResponse)) {
            throw new Error(
                "Response object expected to implement AxiosResponse interface, but did not");
        }

        const serverResponse = state.response.actualResponse as AxiosResponse;
        const httpStatusCode = serverResponse.status;
        let data: CleaningResponseObject|null = null;
        // This is a trick to make the response body always show up in the report
        try {
            data = serverResponse.data;
        } catch{
            // Eat this exception
        }
        I.performNoop(data);
        await I.assertToEqual(httpStatusCode, 400);
        
        I.assertNotToBeEmpty(data);
    }
);