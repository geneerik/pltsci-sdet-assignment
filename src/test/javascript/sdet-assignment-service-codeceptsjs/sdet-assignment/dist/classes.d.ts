/**
 * Module to hold the non-exception classes for the SDET assignment.
 *
 * @module sdet-assignment.classes
 */
import { Helper } from "codeceptjs";
import { AxiosResponse } from "axios";
/**
 * Helper class to empower step discovery where it might be missing and add access to some of the
 * runner features not directly exposed by CodeceptJS
 *
 * @class SimpleHelper
 */
declare class SimpleHelper extends Helper {
    /**
     * Method to allow a call chain via the I mechanism which would not otheriwse be recognized as
     * a step by CodeceptJS
     *
     * @param  {()=>void} action The function to be wrapped in the in the helper method call
     * @returns {any} The value returned by the provided `action` function
     */
    performSimpleAction(action: () => unknown): unknown;
    /**
     * @property {()=>void} _afterSuiteAction Value of the user-defined action to be executed after
     *                                        the end of the test suite.
     */
    protected _afterSuiteAction: () => void | undefined;
    /**
     * Method to set the value of the user-defined action to be executed after the end of the test
     * suite.  The afterSuite mocha runner is not definable by a test suite in some cases, such as
     * when using BDD and so is made available via this mechanism
     *
     * @param  {()=>void} action
     */
    setAfterSuite(action: () => void): void;
    /**
     * Hook executed after each suite
     *
     * @param  {Mocha.Suite} suite The Mocha suite for which the _afterSuite method is being called
     */
    _afterSuite(suite: Mocha.Suite): void;
    /**
     * @property {number|null} server_port Value of the server port to use for the server under
     *                                     test by the current thread when the server process is
     *                                     being managed by the tests
     */
    protected _server_port: number | null;
    /**
     * Method to get the currently selected server port for the server under tests during test
     * execution
     *
     * @returns {number} The currently selected server port for the server under tests
     */
    performSimpleActionGetServerPort(): number | null;
    /**
     * Method to get the currently configured endpoint uri from the REST helper during test
     * execution
     *
     * @returns {string} The currently configured endpoint uri from the REST helper during test
     */
    performSimpleActionGetRestEndpoint(): string;
    /**
     * @property {number|null} _server_debug_port Value of the server debug port to use for the
     *                                            server under test by the current thread when the
     *                                            server process is being managed by the tests
     */
    protected _server_debug_port: number | null;
    /**
     * Method to get the currently selected server debug port for the server under tests during
     * test execution
     *
     * @returns {number} The currently selected server debug port for the server under tests
     */
    performSimpleActionGetServerDebugPort(): number | null;
    /**
     * Hook executed before each suite
     *
     * @param  {Mocha.Suite} suite
     * @returns {void}
     */
    protected _beforeSuite(suite: Mocha.Suite): void;
    /**
     * expect methods.  These are adapted from the codeceptjs-expectwrapper module which claims to
     * have a permissive license [ISC](https://choosealicense.com/licenses/isc/) whose only
     * stipulation is to include the license of the author, however the author has not published
     * one (https://github.com/PeterNgTr/ExpectWrapper), so it could not be included.  The
     * license should permit the integration here
     */
    /**
     * Used when you want to check that two objects have the same value. This matcher recursively
     * checks the equality of all fields, rather than checking for object identity.
     *
     * @param  {any} actual
     * @param  {any} expected
     * @returns {Promise<any>} The results of the expect operation
     */
    assertToEqual(actual: any, expected: unknown): Promise<any>;
    /**
     * Used when you want to check that two objects do not have the same value. This matcher
     * recursively checks the equality of all fields, rather than checking for object identity.
     *
     * @param  {any} actual
     * @param  {any} expected
     * @returns {Promise<any>} The results of the expect operation
     */
    assertNotToEqual(actual: any, expected: unknown): Promise<any>;
    /**
     * Used when you want to check that an item is in a list. For testing the items in the list,
     * this uses `===`, a strict equality check.
     *
     * @param  {any} actual
     * @param  {any} expected
     * @returns {Promise<any>} The results of the expect operation
     */
    assertToContain(actual: any, expected: unknown): Promise<any>;
    /**
     * For comparing floating point numbers.
     *
     * @param  {any} actual
     * @param  {number | bigint} expected
     * @returns {Promise<any>} The results of the expect operation
     */
    assertToBeGreaterThan(actual: any, expected: number | bigint): Promise<any>;
    /**
     * Used when you want to check that a string value is empty. This matcher recursively
     * checks the equality of all fields, rather than checking for object identity.
     *
     * @param  {any} actual
     * @returns {Promise<any>} The results of the expect operation
     */
    assertToBeEmpty(actual: any): Promise<any>;
    /**
     * Used when you want to check that a string value is not empty. This matcher recursively
     * checks the equality of all fields, rather than checking for object identity.
     *
     * @param  {any} actual
     * @returns {Promise<any>} The results of the expect operation
     */
    assertNotToBeEmpty(actual: any): Promise<any>;
    /**
     * Use when you don't care what a value is, you just want to ensure a value is true in a
     * boolean context. In JavaScript, there are six falsy values: `false`, `0`, `''`, `null`,
     * `undefined`, and `NaN`. Everything else is truthy.
     *
     * @param  {any} actual
     * @returns {Promise<any>} The results of the expect operation
     */
    assertToBeTruthy(actual: any): Promise<any>;
    /**
     * When you don't care what a value is, you just want to ensure a value is false in a boolean
     * context.
     *
     * @param  {any} actual
     * @returns {Promise<any>} The results of the expect operation
     */
    assertToBeFalsy(actual: any): Promise<any>;
    /**
     * Used when you want to check that an item is not in a list. For testing the items in the
     * list, this uses `!==`, a strict equality check.
     *
     * @param  {any} actual
     * @param  {any} expected
     * @returns {Promise<any>} The results of the expect operation
     */
    assertNotToContain(actual: any, expected: unknown): Promise<any>;
    /**
     * Use to check if property at provided reference keyPath exists for an object. For checking
     * deeply nested properties in an object you may use dot notation or an array containing the
     * keyPath for deep references.
     *
     * Optionally, you can provide a value to check if it's equal to the value present at keyPath
     * on the target object. This matcher uses 'deep equality' (like `toEqual()`) and recursively
     * checks the equality of all fields.
     *
     * @param  {any} actual The value to assert property existence upon
     * @param  {string | string[]} keyPath Property name or array of names to descend for deeply
     *                                     nested properties
     * @param  {any?} value (Optional) Value to check against the located property
     * @returns {Promise<any>} The results of the expect operation
     */
    assertToHaveProperty(actual: any, keyPath: string | string[], value?: unknown): Promise<any>;
    /**
     * Use to check if property `propertyName` exists for an object.
     *
     * @param  {any} actual
     * @param  {string} propertyName
     * @returns {Promise<any>} The results of the expect operation
     */
    assertObjectToHaveProperty(actual: any, propertyName: string): Promise<any>;
    /**
     * @property {this|null} _server_log_file The path to the log file, if any, for the current
     *                                        server instance being tested
     */
    protected _server_log_file: string | null;
    /**
     * Set the path to the log file so it can be used by other things
     *
     * @param  {string} logFilePath The path to the log file being monitored
     * @return void
     */
    performSimpleActionSetLogFile(logFilePath: string): void;
    /**
     * Get the path to the log file being monitored
     *
     * @returns {string} The path to the log file being monitored
     */
    performSimpleActionGetLogFile(): string | null;
    /**
     * Sends a post request to the cleaning-sessions API endpoint
     *
     * @param  {unknown} cleaningData The data payload to paste to the endpoint
     * @returns Promise returning a AxiosResponse object representing the endpoint response on
     *          request completion
     */
    cleaningSessionsPost(cleaningData: unknown): Promise<AxiosResponse>;
}
export { SimpleHelper };
