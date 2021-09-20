import { actor } from "codeceptjs";
import ex from "codeceptjs-expectwrapper";
import { AxiosResponse } from "axios";
import { CodeceptJSWithTranslation } from ".";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export = function (): CodeceptJSWithTranslation<any> {
    return actor({
        async cleaningSessionsPost(cleaningData:unknown) : Promise<AxiosResponse> {
            const payload = cleaningData;

            return this.sendPostRequest("/v1/cleaning-sessions", payload);
        },
        ...ex});
}