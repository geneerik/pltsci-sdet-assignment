import { actor } from 'codeceptjs';
import ex from 'codeceptjs-expectwrapper';
import { AxiosResponse } from 'axios';
const Step = require("codeceptjs/lib/step");

export = function () {
    return actor({
        async meh() : Promise<void> {
            
            const action = () => 'done';
            const step = new Step({ doSomething: action }, 'doSomething');

            // add methods to promise chain
            return step;
        },
        async cleaningSessionsPost(cleaningData:object) : Promise<AxiosResponse> {
            let payload = cleaningData;

            return this.sendPostRequest('/v1/cleaning-sessions', payload);
        }
    , ...ex});
}