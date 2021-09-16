import { AxiosResponse } from 'axios';
import { CodeceptJSAllurePlugin, DataTable, CleaningResponseObject } from '..';
import * as path from "path";
import { rm, access, constants as fs_constants, watch } from "fs-extra";
import { ChildProcess, spawn } from "child_process";

const allure:CodeceptJSAllurePlugin = codeceptjs.container.plugins('allure');

const { I } = inject();

interface LooseObject {
    [key: string]: any
}

interface ProcessInfoHolderObject extends LooseObject {
    process_object: ChildProcess
}

interface TestState {
    request: LooseObject,
    // TODO: response could be less loose
    response: LooseObject,
    server_process: ProcessInfoHolderObject | null,
    [key: string]: LooseObject | null
}

let state: TestState = {
    request: {},
    response: {},
    server_process: null
};

/**
 * Wait for a file to exist
 * 
 * @param  {string} filePath The path to the file to be waited for
 * @param  {number|undefined} timeout Time to wait for file to exist in milliseconds
 */
function checkExistsWithTimeout(filePath: string, timeout:number | undefined) {
    return new Promise<void>(function (resolve, reject) {

        var timer = setTimeout(function () {
            watcher.close();
            reject(new Error('File did not exists and was not created during the timeout.'));
        }, timeout);

        access(filePath, fs_constants.R_OK, function (err) {
            if (!err) {
                clearTimeout(timer);
                watcher.close();
                resolve();
            }
        });

        var dir = path.dirname(filePath);
        var basename = path.basename(filePath);
        var watcher = watch(dir, function (eventType, filename) {
            if (eventType === 'rename' && filename === basename) {
                clearTimeout(timer);
                watcher.close();
                resolve();
            }
        });
    });
}

// Things to do before each test starts
Before(async () => {
    let server_process_object:ProcessInfoHolderObject|null = null;
    if(!process.env.SERVER_RESTART_TRIGGER_FILE && state.server_process) {
        // stop the service in the background if not in docker compose mode and the state object has server_process object 
        if (state.server_process.process_object.kill()){
            console.warn(`** Server process with PID ${state.server_process.process_object.pid} was not killed`);
        }
    }
    const serverReadyFile =
        process.env.SERVER_RESTART_TRIGGER_FILE?process.env.SERVER_RESTART_TRIGGER_FILE:"/usr/local/demo-app/logs/application.log";
    
    // delete the "ready" file if it exists
    await rm(serverReadyFile, {force: true});

    if(!process.env.SERVER_RESTART_TRIGGER_FILE) {
        // start the service in the background if not in docker compose mode and update the state.server_process object
        const start_script_path = path.join(__dirname, "start_server_no_container.sh");
        const process_object = spawn(
            start_script_path, [], {
                env: process.env,
                stdio: 'inherit'});

        process_object.on('close', (code, signal) => {
            console.log(
                `** Server process terminated due to receipt of signal ${signal}`);
            });

        server_process_object = {
            process_object: process_object
        };
    }

    // wait for the log file to exist
    await checkExistsWithTimeout(serverReadyFile, 20000);

    state = {
        request: {},
        response: {},
        server_process: server_process_object
    };
});

Given('I have a hoover web service running', () => { // eslint-disable-line
    // This will throw an exception if the service is not running
    I.sendGetRequest('/v1/cleaning-sessions');
});

Given('I have a room with {int} width units and {int} height units', async (x: number, y: number) => { // eslint-disable-line
    const coords = [x, y];
    I.performSimpleAction(()=>{
        state.request.roomSize = coords;
    })
});

Given('I have a hoover at coordinates {int} width units and {int} height units', (x: number, y: number) => { // eslint-disable-line
    const coords = [x, y];
    I.performSimpleAction(()=>{
        state.request.coords = coords;
    })
});

Given("I have no dirt to clean", () => { // eslint-disable-line
    I.performSimpleAction(()=>{
        state.request.patches = [];
    });
});

Given("I have dirt to clean a some coordinates", (patchesTable: DataTable) => { // eslint-disable-line
    
    if (!state.request.hasOwnProperty("patches")){
        state.request.patches = [];
    }

    // parse the table by header
    const patchesTableParsed = patchesTable.parse();

    I.performSimpleAction(()=>{
        const patchesTableByHeader = patchesTableParsed.hashes();

        // Loop through rows
        for (const row of patchesTableByHeader) {
            // take values
            const width_units = Number(row.width_units);6
            const height_units = Number(row.height_units);

            // append new array to existing array
            // if the strings converted to numbers dont match when returned to strings, fallback to original value
            state.request.patches = state.request.patches.concat([[
                row.width_units == `${width_units}` ? width_units : row.width_units,
                row.height_units == `${height_units}` ? height_units : row.height_units,
            ]]);
        }
    });
});

When('I give cleaning instructions to move {word}', async (instructions: string) => { // eslint-disable-line
    state.request.instructions = instructions;
    console.debug("Payload to send: >>>\n" + JSON.stringify(state.request) + "<<<");
    
    // execute REST call
	const res:AxiosResponse = await I.cleaningSessionsPost(state.request);

    state.response.actualResponse = res;
});

When('I give cleaning instructions to move {string}', async (instructions: string) => { // eslint-disable-line
    state.request.instructions = instructions;
    console.debug("Payload to send: >>>\n" + JSON.stringify(state.request) + "<<<");
    
    // execute REST call
	const res:AxiosResponse = await I.cleaningSessionsPost(state.request);

    state.response.actualResponse = res;
});

Then('I should see that total number of clean spots is {int}', async (patches: number) => { // eslint-disable-line
    const expectedPatches = patches;
    I.performSimpleAction(async ()=>{
        const res:AxiosResponse = state.response.actualResponse;
        await I.assertEqual(res.status, 200);
        const data:CleaningResponseObject = res.data;
        
        await I.assertToBeTrue(data.hasOwnProperty("patches"));
        await I.assertEqual(data.patches, patches);
    });
});

Then('I should see a hoover at coordinates {int} width units and {int} height units', async (x: number, y: number) => { // eslint-disable-line
    const coords = [x, y];
    I.performSimpleAction(async ()=>{
        const res:AxiosResponse = state.response.actualResponse;
        await I.assertEqual(res.status, 200);
        const data:CleaningResponseObject = res.data;
        
        await I.assertToBeTrue(data.hasOwnProperty("coords"));
        await I.assertEqual(data.coords, coords);
    });
});