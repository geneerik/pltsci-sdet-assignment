/**
 * @module SimplePlugin
 */

import { event } from "codeceptjs";
import { traslateAllureTagsForTest } from "sdet-assignment";
import { threadId } from "worker_threads";
import { Debugger, debug as debugLoggerFactory } from "debug";

/**
 * @property {Debugger} debug Debug logger method
 */
const debug: Debugger = debugLoggerFactory("com.geneerik.sdet-assignment.simpleplugin");

/**
 * Stuff for the plugin to do just before a suite is started
 * 
 * @param  {Mocha.Suite} suite The suite that si about to eb started
 */
function beforeSuite(suite: Mocha.Suite) {
    const suiteTitle = suite.fullTitle();

    debug(`(${threadId}) Plugin before suite event trigger for '${suiteTitle}'`);
}

/**
 * Stuff for the plugin to do just before a test is started
 * 
 * @param  {Mocha.Test} test The test to be performed
 */
function beforeTest(test: Mocha.Test) {
    traslateAllureTagsForTest(test);
}

/**
 * Plugin demonstrating how plugins work and providing the "@issue" tag feature for allure reports
 * on BDD sections
 * 
 * @param  {Record<string} config
 * @returns The plugin
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function simplePlugin (config: Record<string, unknown>): Record<string, unknown> {
    debug(`(${threadId}) Loaded plugin`);
    
    // Configure the event actions hosted by the plugin
    event.dispatcher.on(event.suite.before, beforeSuite);
    event.dispatcher.on(event.test.before, beforeTest);
 
    /**
     * Return some kind of object for the plugin to be valid, but we are not using it at the moment
     */
    const plugin = {};
    
    return plugin;
}

export = simplePlugin;