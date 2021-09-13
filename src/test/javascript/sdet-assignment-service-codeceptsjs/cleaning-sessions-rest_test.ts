import { AxiosResponse } from 'axios';
import 'expect';
import expectExport, { extractExpectedAssertionsErrors } from 'expect';

Feature('cleaning-sessions (REST)');

Scenario('Verify example input', async ({ I }) => {
	const expectedData = {
		"coords": [1,3],
		"patches":1};

	const res:AxiosResponse = await I.cleaningSessionsPost(
		{
			"roomSize" : [5, 5],
			"coords" : [1, 2],
			"patches" : [
				[1, 0],
				[2, 2],
				[2, 3]],
			"instructions" : "NNESEESWNWW" });
	await I.assertEqual(res.status, 200);
	const data:object = res.data;
	
	await I.assertEqual(expectedData, data);
});

Scenario('Verify some input validation', async ({ I }) => {
	const res:AxiosResponse = await I.cleaningSessionsPost(
		{
			"roomSize" : [5, 5],
			"coords" : [1, 2],
			"patches" : [
				[1, 0],
				[2, 2],
				[2, 3]],
			"instructions" : "aNNESEESWNWW" });
	await I.assertEqual(res.status, 400);
	const data:object = res.data;

	// Note: this service gives NO error message about what went wrong; this should likely be considered a bug
	await I.assertEqual("", data);
});