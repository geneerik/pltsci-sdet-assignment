import { AxiosResponse } from "axios";
import { CodeceptJSAllurePlugin, DataTable, CleaningResponseObject } from "..";
import path from "path";
import {
    access, constants as fs_constants, watch, FSWatcher, readFileSync,
    accessSync } from "fs-extra";
import { rm } from "fs";
import { ChildProcess, spawn } from "child_process";
import { clearTimeout } from "timers";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const allure:CodeceptJSAllurePlugin = codeceptjs.container.plugins("allure");

const { I } = inject();

interface LooseObject {
    [key: string]: unknown
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

class TimeoutError extends Error {}

/**
 * Wait for a file to exist
 * 
 * @param  {string} filePath The path to the file to be waited for
 * @param  {number|undefined} timeout Time to wait for file to exist in milliseconds
 */
function checkExistsWithTimeout(filePath: string, timeout:number | undefined) {
    return new Promise<void>(function (resolve, reject) {
        let watcher:FSWatcher|undefined = undefined;
        const timer = setTimeout(function () {
            if (watcher){
                watcher.close();
            }
            reject(
                new TimeoutError(
                    `File "${filePath}" did not exists and was not created during the timeout.`));
        }, timeout);

        access(filePath, fs_constants.R_OK, function (err) {
            if (!err) {
                clearTimeout(timer);
                if (watcher){
                    watcher.close();
                }
                console.warn(`File "${filePath}" already exists`);
                resolve();
            }
        });

        const dir = path.dirname(filePath);
        const basename = path.basename(filePath);
        console.debug(`** watching for file "${basename}" in dir ${dir}`);
        watcher = watch(dir, function (eventType, filename) {
            if (eventType === "rename" && filename === basename) {
                console.debug(`** Detected file "${basename}" in dir ${dir}!`);
                clearTimeout(timer);
                if (watcher){
                    watcher.close();
                }
                resolve();
            }
        });
    });
}

Before(() => {
    // Don"t use this; it is limited due to the inability to execute async code
    // Use Given in a Background block instead
    // console.debug("BEFORE");
});

/*
 * Things to do before each test starts; when used with Background, the bdd callback chain is set
 * as mocha beforeeach method
 */
Given("I have freshly started hoover web server instance", async () => { // eslint-disable-line
    // This will throw an exception if the service is not running
    // console.debug(">>> Start in given");

    let server_process_object:ProcessInfoHolderObject|null = null;
    if(!process.env.NO_SERVER_MANAGEMENT===undefined || process.env.NO_SERVER_MANAGEMENT!="true") {
        if(!process.env.SERVER_RESTART_TRIGGER_FILE && state.server_process) {
            const process_object = state.server_process.process_object;
            const pid = process_object.pid;

            /*
             * stop the service in the background if not in docker compose mode and the state
             * object has server_process object
             */
            if (process_object.kill()){
                console.debug(`** Server process with PID ${pid} was killed`);
            }
            else{
                console.warn(`** Server process with PID ${pid} was not killed`);
            }
            // Now wait for it to really be gone
            const killWaiter = new Promise<void>(function (resolve, reject) {
                console.debug(`Waiting for pid ${pid} to finish`);
                // Set max timeout
                let pollingTimer:NodeJS.Timeout|undefined = undefined;
                const maxTimeoutTimer:NodeJS.Timeout = setTimeout(
                    ()=>{
                        if (pollingTimer) {
                            clearTimeout(pollingTimer);
                        }
                        reject(
                            new TimeoutError(
                                `Timeout shutting down server process with pid ${pid}`));
                    }, 10000);
                const pollingFunction =
                ()=>{
                    if(null!==process_object.exitCode){
                        console.debug(
                            `Server process with pid ${pid} exitted with code` +
                            `${process_object.exitCode}`);
                        clearTimeout(maxTimeoutTimer);
                        resolve();
                    }
                    else{
                        console.debug(`Still waiting for pid ${pid} to finish`);
                        pollingTimer = setTimeout(pollingFunction, 100);
                    }
                };
                pollingTimer = setTimeout(pollingFunction, 100);
            });
            await killWaiter;
        }
        const serverReadyFile =
            process.env.SERVER_RESTART_TRIGGER_FILE ?
                process.env.SERVER_RESTART_TRIGGER_FILE:
                "/usr/local/demo-app/logs/application.log";
        
        // delete the "ready" file if it exists
        let fileDidExist = false;

        try {
            accessSync(serverReadyFile, fs_constants.F_OK);
            fileDidExist = true;
        } catch (err) {
            // eat the exception
        }

        // delete the file if it existed
        if(fileDidExist){
            console.debug(`** Deleting ready file ${serverReadyFile}`);
            const rmWaiter = new Promise<void>((resolve, reject) => {
                rm(
                    serverReadyFile,
                    (err) => {
                        if(err!==undefined && err!==null){
                            reject(err);
                        }
                        resolve();
                    });
            });
            await rmWaiter;
        } else {
            console.debug(`** Ready file ${serverReadyFile} did not exist`);
        }

        if(!process.env.SERVER_RESTART_TRIGGER_FILE) {
            /*
             * start the service in the background if not in docker compose mode and update the
             * state.server_process object
             */
            const start_script_path = path.join(__dirname, "..", "start_server_no_container.sh");
            console.debug("** Starting server process");
            const process_object = spawn(
                start_script_path, [], {
                    env: process.env,
                    //stdio: ["inherit", "inherit", "inherit"]
                });
            process_object.stdout.on("data", (data) => {
                console.log(`service stdout: ${data}`);
            });

            process_object.stderr.on("data", (data) => {
                console.error(`service stdout: ${data}`);
            });

            process_object.on(
                "close", 
                (code, signal) => {
                    console.log(
                        `** Server process terminated due to receipt of signal ${signal}`);
                }
            );

            server_process_object = {
                process_object: process_object
            };
        }

        // wait for the log file to exist
        await checkExistsWithTimeout(serverReadyFile, 20000);

        // wait for message that the app has started
        const stringWaiter = new Promise<void>(function (resolve, reject) {
            console.debug("Waiting for logfile to contain string");
            // Set max timeout
            let pollingTimer:NodeJS.Timeout|undefined = undefined;
            const maxTimeoutTimer:NodeJS.Timeout = setTimeout(
                ()=>{
                    if (pollingTimer) {
                        clearTimeout(pollingTimer);
                    }
                    reject(new TimeoutError("Timeout waiting for logfile to contain string"));
                }, 10000);
            const pollingFunction = ()=>{
                let logContents: Buffer|undefined;
                try{
                    logContents = readFileSync(serverReadyFile);
                } catch(err){
                    reject(err);
                    // just in case...
                    throw err;
                }
                
                if(logContents!==undefined && logContents.includes("Started AppRunner in ")){
                    console.debug("String found in logfile!");
                    clearTimeout(maxTimeoutTimer);
                    resolve();
                }
                else{
                    console.debug("Still waiting for logfile to contain string");
                    pollingTimer = setTimeout(pollingFunction, 100);
                }
            };
            pollingTimer = setTimeout(pollingFunction, 100);
        });
        await stringWaiter;
    }

    state = {
        request: {},
        response: {},
        server_process: server_process_object
    };

    I.setAfterSuite(async () => {
        // This will throw an exception if the service is not running
        console.debug(">>> Start in afterSuite");
    
        if(!process.env.NO_SERVER_MANAGEMENT===undefined ||
                process.env.NO_SERVER_MANAGEMENT!="true") {
            if(!process.env.SERVER_RESTART_TRIGGER_FILE && state.server_process) {
                const pid = state.server_process.process_object.pid;
                const process_object = state.server_process.process_object;
    
                /*
                 * stop the service in the background if not in docker compose mode and the state
                 * object has server_process object 
                 */
                if (state.server_process.process_object.kill()){
                    console.debug(`** Server process with PID ${pid} was killed`);
                }
                else{
                    console.warn(`** Server process with PID ${pid} was not killed`);
                }
                // Now wait for it to really be gone
                const killWaiter = new Promise<void>(function (resolve, reject) {
                    console.debug(`Waiting for pid ${pid} to finish`);
                    // Set max timeout
                    let pollingTimer:NodeJS.Timeout|undefined = undefined;
                    const maxTimeoutTimer:NodeJS.Timeout = setTimeout(
                        ()=>{
                            if (pollingTimer) {
                                clearTimeout(pollingTimer);
                            }
                            reject(
                                new TimeoutError(
                                    `Timeout shutting down server process with pid ${pid}`));
                        }, 10000);
                    const pollingFunction =
                    ()=>{
                        if(null!==process_object.exitCode){
                            console.debug(
                                `Server process with pid ${pid} exitted with code ` +
                                `${process_object.exitCode}`);
                            clearTimeout(maxTimeoutTimer);
                            resolve();
                        }
                        else{
                            console.debug(`Still waiting for pid ${pid} to finish`);
                            pollingTimer = setTimeout(pollingFunction, 100);
                        }
                    };
                    pollingTimer = setTimeout(pollingFunction, 100);
                });
                try{
                    await killWaiter;
                } catch(err){
                    if (err instanceof TimeoutError){
                        console.error(err);
                    }
                    else{
                        throw err;
                    }
                }
            }
        }

        // console.debug("<<< End afterSuite");
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

Given("I have dirt to clean at some coordinates", async (patchesTable: DataTable) => { // eslint-disable-line
    
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
            /*
             * if the strings converted to numbers dont match when returned to strings, fallback to
             * original value
             */
            state.request.patches = patches.concat([[
                row.width_units == `${width_units}` ? width_units : row.width_units,
                row.height_units == `${height_units}` ? height_units : row.height_units,
            ]]);
        }
    });
});

When("I give cleaning instructions to move {word}", async (instructions: string) => { // eslint-disable-line
    state.request.instructions = instructions;
    console.debug("Payload to send: >>>\n" + JSON.stringify(state.request) + "<<<");
    
    // execute REST call
    const res:AxiosResponse = await I.cleaningSessionsPost(state.request);

    state.response.actualResponse = res;
});

When("I give cleaning instructions to move {string}", async (instructions: string) => { // eslint-disable-line
    state.request.instructions = instructions;
    console.debug("Payload to send: >>>\n" + JSON.stringify(state.request) + "<<<");
    
    // execute REST call
    const res:AxiosResponse = await I.cleaningSessionsPost(state.request);

    state.response.actualResponse = res;
});

Then("I should see that total number of clean spots is {int}", async (patches: number) => { // eslint-disable-line
    const expectedPatches = patches;
    I.performSimpleAction(async ()=>{
        // TODO: fix this
        /*if (!(state.response.actualResponse instanceof AxiosResponse)) {
            throw new Error();
        }*/

        const res = state.response.actualResponse as AxiosResponse;
        I.assertEqual(res.status, 200);
        const data:CleaningResponseObject = res.data;
        
        I.assertToBeTrue(Object.prototype.hasOwnProperty.call(data, "patches"));
        I.assertEqual(data.patches, expectedPatches);
    });
});

Then("I should see a hoover at coordinates {int} width units and {int} height units", async (x: number, y: number) => { // eslint-disable-line
    const coords = [x, y];
    I.performSimpleAction(async ()=>{
        // TODO: fix this
        /*if (!(state.response.actualResponse instanceof AxiosResponse)) {
            throw new Error();
        }*/

        const res = state.response.actualResponse as AxiosResponse;
        I.assertEqual(res.status, 200);
        const data:CleaningResponseObject = res.data;
        
        I.assertToBeTrue(Object.prototype.hasOwnProperty.call(data, "coords"));
        I.assertEqual(data.coords, coords);
    });
});