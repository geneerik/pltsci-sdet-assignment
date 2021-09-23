import { AxiosResponse } from "axios";
import path from "path";
import { ChildProcess, spawn, SpawnOptions, StdioOptions } from "child_process";
import { threadId } from "worker_threads";
import {
    TestState, ProcessInfoHolderObject, CodeceptJSAllurePlugin,
    CleaningResponseObject, CodeceptJSDataTable, checkExistsWithTimeout,
    NullableLooseObject, waitForProcessToBeKilled, deleteFileIfExisted,
    waitForLogFileToContainString, isAxiosResponse } from "sdet-assignment";

/**
 * @property {CodeceptJSAllurePlugin} allurePlugin Plugin object instance used to set allure
 *                                                 specific labels on the currently running test
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const allurePlugin: CodeceptJSAllurePlugin = codeceptjs.container.plugins("allure");

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

Before(() => {
    // Don"t use this; it is limited due to the inability to execute async code
    // Use Given in a Background block instead
    // console.debug("BEFORE");
});

/**
 * Things to do before each test starts; when used with Background, the bdd callback chain is set
 * as mocha beforeeach method
 */
Given("I have freshly started hoover web server instance", async () => { // eslint-disable-line
    // This will throw an exception if the service is not running
    // console.debug(">>> Start in given");

    const restEndpoint = await I.simpleActionGetRESTEndpoint();
    console.debug(`(${threadId}) Endpoint: ${restEndpoint}`);

    // Set the default server_process_object holder
    let server_process_object: ProcessInfoHolderObject|null = null;

    // ensure the server is freshly started if we can
    if(!process.env.NO_SERVER_MANAGEMENT===undefined || process.env.NO_SERVER_MANAGEMENT!="true") {
        // Kill existing server process if we are managing it
        if((!process.env.SERVER_IS_EXTERNAL===undefined ||
                    process.env.SERVER_IS_EXTERNAL!="true") &&
                state.server_process) {
            await waitForProcessToBeKilled(state.server_process.process_object);
        }

        // Look up the log file we are supposed to monitor
        const serverReadyFile =
            (process.env.SERVER_RESTART_TRIGGER_FILE ??
                `/usr/local/demo-app/logs/application-${threadId}.log`);
        
        // delete the "ready" file if it exists
        await deleteFileIfExisted(serverReadyFile);

        // Start a new instance of the server process if we are managing it
        if((!process.env.SERVER_IS_EXTERNAL===undefined ||
                process.env.SERVER_IS_EXTERNAL!="true")) {
            /**
             * start the service in the background if not in docker compose mode and update the
             * state.server_process object
             */

            // Get the "server_port" for the server under test
            const server_port: number|null = await I.simpleActionGetServerPort();

            if (null === server_port) {
                throw new Error(`(${threadId}) Cannot start server process: server_port is null!`);
            }

            const server_debug_port: number|null = await I.simpleActionGetServerDebugPort();

            // Copy the process env so we can append to the child process env
            const envCopy: NullableLooseObject =
                Object.assign({}, process.env, {
                    // Override with requested env settings
                    SERVER_FLAGS:
                        `-Dserver.port=${server_port} -Dlogging.file=${serverReadyFile}`,
                    DEBUG_PORT: `${server_debug_port}`
                });

            const serverSpawnStioOpts: StdioOptions = [
                "pipe",
                "pipe",
                "pipe"
            ];
        
            const serverSpawnOpts: SpawnOptions = {
                env: envCopy,
                stdio: serverSpawnStioOpts
            };

            const start_script_path = path.join(__dirname, "..", "start_server_locally.sh");
            console.debug(`(${threadId}) Starting server process (port ${server_port})`);
            const process_object: ChildProcess = spawn(
                start_script_path, [], serverSpawnOpts);

            if (process_object.stdout) {
                process_object.stdout.on("data", (data) => {
                    console.log(`(${threadId}) service stdout: ${data}`);
                });
            }

            if (process_object.stderr) {
                process_object.stderr.on("data", (data) => {
                    console.error(`(${threadId}) service stderr: ${data}`);
                });
            }

            process_object.on(
                "close", 
                (code, signal) => {
                    console.log(
                        `(${threadId}) Server process terminated due to receipt of signal ` +
                        `${signal}`);
                }
            );

            server_process_object = {
                process_object: process_object
            };
        }

        // wait for the log file to exist
        await checkExistsWithTimeout(serverReadyFile, 20000);

        // wait for message that the app has started
        await waitForLogFileToContainString(
            serverReadyFile, "Started AppRunner in ", null, null,
            server_process_object ?
                server_process_object.process_object :
                null);
    }

    state = {
        request: {},
        response: {},
        server_process: server_process_object
    };

    // Set the actions that need to be done when the suite ends (shuts down)
    I.setAfterSuite(async () => {
        // This will throw an exception if the service is not running
        console.debug(`(${threadId}) Start in afterSuite`);
    
        // Ensure the server process is shut down if we are managing it
        if(!process.env.NO_SERVER_MANAGEMENT===undefined ||
            process.env.NO_SERVER_MANAGEMENT!="true") {

            // Kill existing server process if we are managing it
            if((!process.env.SERVER_IS_EXTERNAL===undefined ||
                        process.env.SERVER_IS_EXTERNAL!="true") &&
                    state.server_process) {
                await waitForProcessToBeKilled(state.server_process.process_object);
            }
        }

        console.debug(`(${threadId}) End afterSuite`);
    });

    // console.debug("<<< End in given");
});

Given("the hoover web service running", async () => { // eslint-disable-line
    // This will throw an exception if the service is not running
    await I.sendGetRequest("/v1/cleaning-sessions");
});

Given("I have a room with {int} width units and {int} height units", async (x: number, y: number) => { // eslint-disable-line
    // console.debug("** CONTROL!");
    const coords = [x, y];
    await I.performSimpleAction(()=>{
        state.request.roomSize = coords;
    });
});

Given("I have a hoover at coordinates {int} width units and {int} height units", async (x: number, y: number) => { // eslint-disable-line
    const coords = [x, y];
    await I.performSimpleAction(()=>{
        state.request.coords = coords;
    });
});

Given("I have no dirt to clean", async () => { // eslint-disable-line
    await I.performSimpleAction(()=>{
        state.request.patches = [];
    });
});

Given(
    "I have dirt to clean at some coordinates",
    async (patchesTable: CodeceptJSDataTable) => { // eslint-disable-line
    
        if (!Object.prototype.hasOwnProperty.call(state.request, "patches") || 
                !Array.isArray(state.request.patches)){
            state.request.patches = [];
        }

        // parse the table by header
        const patchesTableParsed = patchesTable.parse();

        await I.performSimpleAction(()=>{
            const patchesTableByHeader = patchesTableParsed.hashes();

            // Loop through rows
            for (const row of patchesTableByHeader) {
                // take values
                const width_units = Number(row.width_units);
                const height_units = Number(row.height_units);

                if (!Array.isArray(state.request.patches)){
                    throw new Error(
                        "state.request.patches expected to be Array but is not. type " +
                        `${typeof state.request.patches}`);
                }
                const patches = state.request.patches as [[unknown]];

                // append new array to existing array
                /**
                 * if the strings converted to numbers dont match when returned to strings,
                 * fallback to original value
                 */
                state.request.patches = patches.concat([[
                    row.width_units == `${width_units}` ? width_units : row.width_units,
                    row.height_units == `${height_units}` ? height_units : row.height_units,
                ]]);
            }
        });
    }
);

When("I give cleaning instructions to move {word}", async (instructions: string) => { // eslint-disable-line
    state.request.instructions = instructions;
    console.debug(`(${threadId}) Payload to send: >>>\n` + JSON.stringify(state.request) + "<<<");
    
    // execute REST call
    const res:AxiosResponse = await I.cleaningSessionsPost(state.request);

    state.response.actualResponse = res;
});

When("I give cleaning instructions to move {string}", async (instructions: string) => { // eslint-disable-line
    state.request.instructions = instructions;
    console.debug(`(${threadId}) Payload to send: >>>\n` + JSON.stringify(state.request) + "<<<");
    
    // execute REST call
    const res:AxiosResponse = await I.cleaningSessionsPost(state.request);

    state.response.actualResponse = res;
});

Then("I should see that total number of clean spots is {int}", async (patches: number) => { // eslint-disable-line
    const expectedPatches = patches;
    I.performSimpleAction(async ()=>{
        if (!isAxiosResponse(state.response.actualResponse)) {
            throw new Error();
        }

        const res = state.response.actualResponse as AxiosResponse;
        I.assertEqual(res.status, 200);
        const data: CleaningResponseObject = res.data;
        
        I.assertToBeTrue(Object.prototype.hasOwnProperty.call(data, "patches"));
        I.assertEqual(data.patches, expectedPatches);
    });
});

Then("I should see a hoover at coordinates {int} width units and {int} height units", async (x: number, y: number) => { // eslint-disable-line
    const coords = [x, y];
    I.performSimpleAction(async ()=>{
        if (!isAxiosResponse(state.response.actualResponse)) {
            throw new Error();
        }

        const res = state.response.actualResponse as AxiosResponse;
        I.assertEqual(res.status, 200);
        const data: CleaningResponseObject = res.data;
        
        I.assertToBeTrue(Object.prototype.hasOwnProperty.call(data, "coords"));
        I.assertEqual(data.coords, coords);
    });
});