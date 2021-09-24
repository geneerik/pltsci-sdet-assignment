import { AxiosResponse } from "axios";

Feature("cleaning-sessions (REST)");

Scenario("Verify example input", async ({ I }) => {
    const expectedData = {
        "coords": [1,3],
        "patches":1};

    const serverResponse:AxiosResponse = await I.cleaningSessionsPost(
        {
            "roomSize" : [5, 5],
            "coords" : [1, 2],
            "patches" : [
                [1, 0],
                [2, 2],
                [2, 3]],
            "instructions" : "NNESEESWNWW" });
    I.assertToEqual(serverResponse.status, 200);
    const data:unknown = serverResponse.data;
    
    I.assertToEqual(expectedData, data);
});


Scenario("Verify some input validation", async ({ I }) => {
    // allure.issue("8675309");
    const serverResponse:AxiosResponse = await I.cleaningSessionsPost(
        {
            "roomSize" : [5, 5],
            "coords" : [1, 2],
            "patches" : [
                [1, 0],
                [2, 2],
                [2, 3]],
            "instructions" : "aNNESEESWNWW" });
    I.assertToEqual(serverResponse.status, 400);
    const data:unknown = serverResponse.data;

    /*
	 * Note: this service gives NO error message about what went wrong; this should likely be
	 * considered a bug
	 */
    I.assertToBeEmpty(data);
});