import { AxiosResponse } from "axios";

// To keep type-hinting working well, this function need to remain un-typed
// eslint-disable-next-line max-len
// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
export = function () {
    return actor({
        async cleaningSessionsPost(cleaningData:unknown) : Promise<AxiosResponse> {
            const payload = cleaningData;

            return this.sendPostRequest("/v1/cleaning-sessions", payload);
        }
    });
}