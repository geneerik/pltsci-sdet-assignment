import { threadId } from "worker_threads";
import { format as stringFormat } from "util";

/** 
 * Helper class to empower step discovery where is might be missing and add access to some of the
 * runner features not directly exposed by CodeceptJS
 */
export = class SimpleHelper extends Helper {
    
    /**
     * Method to allow a call chain via the I mechanism which would not otheriwse be recognized as
     * a step by CodeceptJS
     * 
     * @param  {()=>void} action The function to be wrapped in the in the helper method call
     * @returns any
     */
    performSimpleAction(action:()=>unknown): unknown {
        return action();
    }

    /**
     * @property {()=>void} afterSuiteAction Value of the user-defined action to be executed after
     *                                       the end of the test suite.
     */
    protected afterSuiteAction:()=>void|undefined;
    
    /**
     * Method to set the value of the user-defined action to be executed after the end of the test
     * suite.  The afterSuite mocha runner is not definable by a test suite in some cases, such as
     * when using BDD and so is made available via this mechanism
     * 
     * @param  {()=>void} action
     */
    setAfterSuite(action:()=>void): void {
        this.afterSuiteAction = action;
    }

    /**
     * Hook executed after each suite
     * 
     * @param  {Mocha.Suite} suite The Mocha suite for which the _afterSuite method is being called
     */
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    _afterSuite(suite: Mocha.Suite): void {
        if (undefined !== this.afterSuiteAction){
            this.afterSuiteAction();
        }
    }

    /**
     * @property {number|null} server_port Value of the server port to use for the server under
     *                                     test by the current thread when the server process is
     *                                     being managed by the tests
     */
    protected server_port: number|null = null;

    /**
     * Method to get the currently selected server port for the server under tests during test
     * execution
     * 
     * @returns number
     */
    simpleActionGetServerPort(): number|null {
        return this.server_port;
    }
    /**
     * Method to get the actual currently configured endpoint uri from the REST helper during test
     * execution
     * 
     * @returns string
     */
    simpleActionGetRESTEndpoint(): string {
        return this.helpers.REST.options.endpoint;
    }

    /**
     * @property {number|null} server_port Value of the server debug port to use for the server
     *                                     under test by the current thread when the server process
     *                                     is being managed by the tests
     */
    protected server_debug_port: number|null = null;

    simpleActionGetServerDebugPort(): number|null {
        return this.server_debug_port;
    }

    /**
     * Hook executed before each suite
     * 
     * @param  {Mocha.Suite} suite
     * @returns void
     */
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    protected _beforeSuite(suite: Mocha.Suite): void {

        // Select a server port for the server under test in this test runner
        this.server_port = 8080 + threadId;
        // Select a server debug port for the server under test in this test runner
        this.server_debug_port = 4000 + threadId;

        // Set the endpoint for the REST helper to the uri for the server in this thread
        this.helpers.REST.options.endpoint =
            stringFormat(
                process.env.TARGET_BASE_URI?process.env.TARGET_BASE_URI:"http://localhost:%s",
                `${this.server_port}`);
    }
}
