//import { Test } from "allure-js-commons";
import { event } from "codeceptjs";
//import { Test } from "mocha";
import { escapeStringRegexp, CodeceptJSAllurePlugin } from "sdet-assignment";
import { threadId } from "worker_threads";
import { Debugger, debug as debugLoggerFactory } from "debug";

/**
 * @property {Debugger} debug Debug logger method
 */
const debug: Debugger = debugLoggerFactory("com.geneerik.sdet-assignment.simpleplugin");

const issueTagRegex = new RegExp(
    process.env.DEFAULT_ISSUE_REGEX ?? (
        process.env.DEFAULT_ISSUE_PREFIX ?
            "^" + escapeStringRegexp(process.env.DEFAULT_ISSUE_PREFIX) + "(.+)$" :
            "^@ISSUE:(.+)$"), "i");

debug(`(${threadId}) Issue regex pattern: ${issueTagRegex.source}`);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
module.exports = (config: Record<string, unknown>): Record<string, unknown> => {
    debug(`(${threadId}) Loaded plugin`);
    
    event.dispatcher.on(event.suite.before, (suite: Mocha.Suite) => {
        const suiteTitle = suite.fullTitle();

        debug(`(${threadId}) Plugin before suite event trigger for '${suiteTitle}'`);
    });

    event.dispatcher.on(event.test.before, (test: Mocha.Test) => {
        const allurePlugin: CodeceptJSAllurePlugin = codeceptjs.container.plugins("allure");
        if (!allurePlugin){
            return;
        }

        const testTitle = test.fullTitle();

        debug(`(${threadId}) Plugin before test event trigger for '${testTitle}'`);

        const testTags: string[] = test.tags;
        const nonIssueTags: string[] = [];
        const issueTags: string[] = [];
        const issueValues: string[] = [];
        testTags.forEach (
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            (value: string, index: number, array: string[]) => {
                debug(
                    `(${threadId}) Plugin cycling tags '${value}' on '${testTitle}'`);

                const matches = issueTagRegex.exec(value);
                if(null === matches || undefined === matches) {
                    debug(
                        `(${threadId}) !! Plugin tag '${value}' didnt match on '${testTitle}'`);
                    nonIssueTags.push(value);
                    return;
                }
                debug(
                    `(${threadId}) Plugin tag '${value}' has matches on '${testTitle}'`);
                /*const groups = matches.groups;
                if(null === groups || undefined === groups) {*/
                if(matches.length < 2) {
                    debug(
                        `(${threadId}) !! Plugin tag '${value}' match has no groups on ` +
                        `'${testTitle}'`);
                    nonIssueTags.push(value);
                    return;
                }
                debug(
                    `(${threadId}) Plugin tag '${value}' has match groups on '${testTitle}'`);
                //const issueValue = groups[1];
                const issueValue = matches[1];
                if(null === issueValue || undefined === issueValue) {
                    nonIssueTags.push(value);
                    return;
                }
                debug(
                    `(${threadId}) Plugin found tag '${value}' value '${issueValue}' on ` +
                    `'${testTitle}'`);
                issueTags.push(value);
                issueValues.push(issueValue);
            }
        );

        // Remove any tags matching our pattern from the list of normal tags
        test.tags = nonIssueTags;

        // convert tags matching the pattern to allure issu tags
        issueValues.forEach (
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            (value: string, index: number, array: string[]) => {
                debug(
                    `(${threadId}) Plugin adding issue '${value}' on '${testTitle}'`);

                allurePlugin.issue(value);
            }
        );

        // remove the matching tags from the end of the test name
        let updatedTestName = test.title;

        issueTags.forEach (
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            (value: string, index: number, array: string[]) => {
                const escapedTagName = escapeStringRegexp(value);
                const tagRegex = new RegExp(
                    " " + escapedTagName + "\\b(?! " + escapedTagName + "\\b)");
                updatedTestName = updatedTestName.replace(tagRegex, "");

                debug(
                    `(${threadId}) Plugin new test name from '${testTitle}' is now ` +
                    `'${updatedTestName}' on '${value}' using '${tagRegex.source}'`);
            }
        );

        updatedTestName = updatedTestName.trimRight();
        debug(
            `(${threadId}) Plugin final test name is now ` +
            `'${updatedTestName}' on '${testTitle}'`);


        test.title = updatedTestName;
    });
 
    /**
     * Return some kind of object for the plugin to be valid, but we are not using it at the moment
     */
    const plugin = {};
    
    return plugin;
};