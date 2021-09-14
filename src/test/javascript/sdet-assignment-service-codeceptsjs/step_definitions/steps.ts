import { AxiosResponse } from 'axios';

const { I } = inject();

interface LooseObject {
    [key: string]: any
}

interface TestState {
    request: LooseObject,
    // TODO: response could be less loose
    response: LooseObject,
    [key: string]: LooseObject
}

let state: TestState = {
    request: {},
    response: {}
};

// inside step_definitions
Before(() => {
    state = {
        request: {},
        response: {}
    };
});

Given('I have a hoover web service running', () => { // eslint-disable-line
    // This will throw an exception if the service is not running
    I.sendGetRequest('/v1/cleaning-sessions');
});

Given('I have a room with {int} width units and {int} height units', (x: number, y: number) => { // eslint-disable-line
    state.request.roomSize = [x,y];
});

Given('I have a hoover at coordinates {int} width units and {int} height units', (x: number, y: number) => { // eslint-disable-line
    state.request.coords = [x,y];
});

Given('I have dirt to clean a some coordinates', (patchesTable: DataTable) => { // eslint-disable-line
    
    if (!state.request.hasOwnProperty("patches")){
        state.request.patches = [];
    }

    // parse the table by header
    const patchesTableParsed = patchesTable.parse();
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
    const res:AxiosResponse = state.response.actualResponse;
    await I.assertEqual(res.status, 200);
	const data:CleaningResponseObject = res.data;
	
    await I.assertToBeTrue(data.hasOwnProperty("patches"));
	await I.assertEqual(data.patches, patches);
});

Then('I should see a hoover at coordinates {int} width units and {int} height units', async (x: number, y: number) => { // eslint-disable-line
    const coords = [x, y];

    const res:AxiosResponse = state.response.actualResponse;
    await I.assertEqual(res.status, 200);
	const data:CleaningResponseObject = res.data;
	
    await I.assertToBeTrue(data.hasOwnProperty("coords"));
	await I.assertEqual(data.coords, coords);
});