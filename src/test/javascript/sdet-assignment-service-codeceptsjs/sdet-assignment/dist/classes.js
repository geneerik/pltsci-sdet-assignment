"use strict";
/**
 * Module to hold the non-exception classes for the SDET assignment.
 *
 * @module sdet-assignment.classes
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleHelper = void 0;
const expect_1 = __importDefault(require("expect"));
const util_1 = require("util");
const worker_threads_1 = require("worker_threads");
const codeceptjs_1 = require("codeceptjs");
/**
 * Helper class to empower step discovery where it might be missing and add access to some of the
 * runner features not directly exposed by CodeceptJS
 *
 * @class SimpleHelper
 */
class SimpleHelper extends codeceptjs_1.Helper {
    constructor() {
        super(...arguments);
        /**
         * @property {number|null} server_port Value of the server port to use for the server under
         *                                     test by the current thread when the server process is
         *                                     being managed by the tests
         */
        this._server_port = null;
        /**
         * @property {number|null} server_port Value of the server debug port to use for the server
         *                                     under test by the current thread when the server process
         *                                     is being managed by the tests
         */
        this._server_debug_port = null;
    }
    /**
     * Method to allow a call chain via the I mechanism which would not otheriwse be recognized as
     * a step by CodeceptJS
     *
     * @param  {()=>void} action The function to be wrapped in the in the helper method call
     * @returns {any} The value returned by the provided `action` function
     */
    performSimpleAction(action) {
        return action();
    }
    /**
     * Method to set the value of the user-defined action to be executed after the end of the test
     * suite.  The afterSuite mocha runner is not definable by a test suite in some cases, such as
     * when using BDD and so is made available via this mechanism
     *
     * @param  {()=>void} action
     */
    setAfterSuite(action) {
        this._afterSuiteAction = action;
    }
    /**
     * Hook executed after each suite
     *
     * @param  {Mocha.Suite} suite The Mocha suite for which the _afterSuite method is being called
     */
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    _afterSuite(suite) {
        if (undefined !== this._afterSuiteAction) {
            this._afterSuiteAction();
        }
    }
    /**
     * Method to get the currently selected server port for the server under tests during test
     * execution
     *
     * @returns {number} The currently selected server port for the server under tests
     */
    performSimpleActionGetServerPort() {
        return this._server_port;
    }
    /**
     * Method to get the currently configured endpoint uri from the REST helper during test
     * execution
     *
     * @returns {string} The currently configured endpoint uri from the REST helper during test
     */
    performSimpleActionGetRestEndpoint() {
        return this.helpers.REST.options.endpoint;
    }
    /**
     * Method to get the currently selected server debug port for the server under tests during
     * test execution
     *
     * @returns {number} The currently selected server debug port for the server under tests
     */
    performSimpleActionGetServerDebugPort() {
        return this._server_debug_port;
    }
    /**
     * Hook executed before each suite
     *
     * @param  {Mocha.Suite} suite
     * @returns {void}
     */
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    _beforeSuite(suite) {
        var _a;
        // Select a server port for the server under test in this test runner
        this._server_port = 8080 + worker_threads_1.threadId;
        // Select a server debug port for the server under test in this test runner
        this._server_debug_port = 4000 + worker_threads_1.threadId;
        // Set the endpoint for the REST helper to the uri for the server in this thread
        this.helpers.REST.options.endpoint =
            (0, util_1.format)((_a = process.env.TARGET_BASE_URI) !== null && _a !== void 0 ? _a : "http://localhost:%s", `${this._server_port}`);
    }
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
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    async assertToEqual(actual, expected) {
        return (0, expect_1.default)(actual).toEqual(expected);
    }
    /**
     * Used when you want to check that two objects do not have the same value. This matcher
     * recursively checks the equality of all fields, rather than checking for object identity.
     *
     * @param  {any} actual
     * @param  {any} expected
     * @returns {Promise<any>} The results of the expect operation
     */
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    async assertNotToEqual(actual, expected) {
        return (0, expect_1.default)(actual).not.toEqual(expected);
    }
    /**
     * Used when you want to check that an item is in a list. For testing the items in the list,
     * this uses `===`, a strict equality check.
     *
     * @param  {any} actual
     * @param  {any} expected
     * @returns {Promise<any>} The results of the expect operation
     */
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    async assertToContain(actual, expected) {
        return (0, expect_1.default)(actual).toContain(expected);
    }
    /**
     * For comparing floating point numbers.
     *
     * @param  {any} actual
     * @param  {number | bigint} expected
     * @returns {Promise<any>} The results of the expect operation
     */
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    async assertToBeGreaterThan(actual, expected) {
        return (0, expect_1.default)(actual).toBeGreaterThan(expected);
    }
    /**
     * Used when you want to check that a string value is empty. This matcher recursively
     * checks the equality of all fields, rather than checking for object identity.
     *
     * @param  {any} actual
     * @returns {Promise<any>} The results of the expect operation
     */
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    async assertToBeEmpty(actual) {
        return (0, expect_1.default)(actual).toEqual("");
    }
    /**
     * Used when you want to check that a string value is not empty. This matcher recursively
     * checks the equality of all fields, rather than checking for object identity.
     *
     * @param  {any} actual
     * @returns {Promise<any>} The results of the expect operation
     */
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    async assertNotToBeEmpty(actual) {
        return (0, expect_1.default)(actual).not.toEqual("");
    }
    /**
     * Use when you don't care what a value is, you just want to ensure a value is true in a
     * boolean context. In JavaScript, there are six falsy values: `false`, `0`, `''`, `null`,
     * `undefined`, and `NaN`. Everything else is truthy.
     *
     * @param  {any} actual
     * @returns {Promise<any>} The results of the expect operation
     */
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    async assertToBeTruthy(actual) {
        return (0, expect_1.default)(actual).toBeTruthy();
    }
    /**
     * When you don't care what a value is, you just want to ensure a value is false in a boolean
     * context.
     *
     * @param  {any} actual
     * @returns {Promise<any>} The results of the expect operation
     */
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    async assertToBeFalsy(actual) {
        return (0, expect_1.default)(actual).toBeFalsy();
    }
    /**
     * Used when you want to check that an item is not in a list. For testing the items in the
     * list, this uses `!==`, a strict equality check.
     *
     * @param  {any} actual
     * @param  {any} expected
     * @returns {Promise<any>} The results of the expect operation
     */
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    async assertNotToContain(actual, expected) {
        return (0, expect_1.default)(actual).not.toContain(expected);
    }
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
    async assertToHaveProperty(
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    actual, keyPath, value) {
        return (0, expect_1.default)(actual).toHaveProperty(keyPath, value);
    }
    /**
     * Use to check if property `propertyName` exists for an object.
     *
     * @param  {any} actual
     * @param  {string} propertyName
     * @returns {Promise<any>} The results of the expect operation
     */
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    async assertObjectToHaveProperty(actual, propertyName) {
        return (0, expect_1.default)(Object.prototype.hasOwnProperty.call(actual, propertyName)).toBeTruthy();
    }
    /**
     * Sends a post request to the cleaning-sessions API endpoint
     *
     * @param  {unknown} cleaningData The data payload to paste to the endpoint
     * @returns Promise returning a AxiosResponse object representing the endpoint response on
     *          request completion
     */
    async cleaningSessionsPost(cleaningData) {
        const restPlugin = codeceptjs.container.helpers("REST");
        return restPlugin.sendPostRequest("/v1/cleaning-sessions", cleaningData);
    }
}
exports.SimpleHelper = SimpleHelper;
