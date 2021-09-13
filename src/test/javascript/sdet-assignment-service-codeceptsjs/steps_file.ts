import { actor } from 'codeceptjs';
import ex from 'codeceptjs-expectwrapper';
import { AxiosResponse } from 'axios';

export = function () {
    return actor({
        async cleaningSessionsPost(cleaningData:object) : Promise<AxiosResponse> {
            let payload = cleaningData;

            return this.sendPostRequest('/v1/cleaning-sessions', payload);
        }
    , ...ex});
}