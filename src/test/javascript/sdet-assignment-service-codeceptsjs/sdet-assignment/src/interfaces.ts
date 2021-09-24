/**
 * Module to hold the custom Interfaces to be used by the library.
 *
 * @module sdet-assignment
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChildProcess, SpawnOptionsWithoutStdio } from "child_process";
import { TYPE as AllureTYPE } from "allure-js-commons";

/**
 * Object representing a span of text in a line and the column at which it was observed
 */
interface GherkinTextSpan {
    /**
     * @property {number} column The column number at which the text was observed
     */
    column: number,

    /**
     * @property {string} text The string comprising the text span
     */
    text: string
}

/**
 * Object representing a line in a Gherkin document
 *
 * @class GherkinLine
 */
interface GherkinLine {
    /**
     * @property {string} lineText The text this object points to
     */
    lineText: string,

    /**
     * @property {number} lineNumber The line number on which `lineText` was observed
     */
    lineNumber: number,

    /**
     * @property {string} trimmedLineText The value of `lineText` after trimming white spaces
     */
    trimmedLineText: string,

    /**
     * @property {boolean} isEmpty Whether or not this is an empty line
     */
    isEmpty: boolean;

    /**
     * @property {number} indent The number of characters of indentation before the start of 
     *                           `trimmedLineText`
     */
    indent: number

    /**
     * Get the list of tags for the line including information on where they were observed
     *
     * @returns {GherkinTextSpan} The array of tags found in the line
     */
    getTags(): GherkinTextSpan[];

    /**
     * Get any table cells defined in the line including information on where they were observed
     * 
     * @returns {GherkinCellSpan} The array of table cells in the line
     */
    getTableCells(): GherkinTextSpan[];

    /**
     * Get the remaining text of the line after removing `length` characters from the beginning of
     * the line and trimming white space from the end
     *
     * @param  {number} length The number of characters to remove from the beginning for the line
     * @returns {string} The remaining text of the line after removing `length` characters from the
     *                   beginning of the line and trimming white space from the end
     */
    getRestTrimmed(length: number): string;

    /**
     * Get the remaining text of the line after removing `indentToRemove` characters from the
     * beginning of the line.  Will not remove more that `indent` characters.  If `indentToRemove`
     * is negative or more than `indent`, return `trimmedLineText`
     *
     * @param  {number} indentToRemove The number of characters requested to be removed from the
     *                                 beginning of the line text
     * @returns {string} the remaining text of the line after removing `indentToRemove` characters
     *                   from the beginning of the line, or,  if `indentToRemove` is negative or
     *                   more than `indent`, `trimmedLineText`
     */
    getLineText(indentToRemove: number): string;

    /**
     * Get whether of not `trimmedLineText` begins with the specified text and `:`
     * 
     * @param  {string} keyword The text to check for.  This will have `:` appended to it
     * @returns {boolean} Whether of not `trimmedLineText` begins with the specified text and `:`
     */
    startsWithTitleKeyword(keyword: string): boolean;

    /**
     * Get whether of not `trimmedLineText` begins with the specified text
     * 
     * @param  {string} prefix The text to check for
     * @returns {boolean} Whether of not `trimmedLineText` begins with the specified text
     */
    startsWith(prefix: string): boolean;
}

/**
 * Object representing the location in a Gherkin document in which a `GherkinAstObject` was observed
 */
interface GherkinLocation {
    /**
     * @property The line on which the `GherkinAstObject` was observed
     */
    line: GherkinLine,

    /**
     * @property The column number in the `line` on which the `GherkinAstObject` was observed
     */
    column: number
}

/**
 * Object representing data parsed from a gherkin document
 */
interface GherkinAstObject {
    /**
     * @property {string} type The name of the object type
     */
    type: string
}

/**
 * Object representing data parsed from a Gherkin document that qualifies as a rule
 *
 * @extends GherkinAstObject
 */
interface GherkinAstRule extends GherkinAstObject {
    /**
     * @property {GherkinLocation} location The location in a Gherkin document in which the rule
     *                                      was observed
     */
    location: GherkinLocation
}

/**
 * Object resenting a data cell in a `GherkinAstTableRow`
 *
 * @extends GherkinAstRule
 * @see {@link GherkinAstTableRow}
 */
interface GherkinAstTableCell extends GherkinAstRule {
    type: "TableCell",

    /**
     * @property {string} value The value of the data in the cell
     */
    value: string
}

/**
 * Object resenting a data row in a `GherkinAstDataTable`
 *
 * @extends GherkinAstRule
 * @see {@link GherkinAstDataTable}
 */
interface GherkinAstTableRow extends GherkinAstRule
{
    type: "TableRow",

    /**
     * @property {GherkinAstTableCell[]} cells The array of `GherkinAstTableCell` object in the row
     */
    cells: GherkinAstTableCell[]
}

/**
 * Object representing a table of data observed in a Gherkin document
 *
 * @extends GherkinAstRule
 */
interface GherkinAstDataTable extends GherkinAstRule {
    type: "DataTable",

    /**
     * @property {GherkinAstTableRow[]} rows An array of rows of data in the data table
     */
    rows: GherkinAstTableRow[];
}

/**
 * Object representing the contents of a `GherkinAstDataTable` after being parsed into just its
 * data with further methods to iterate through the data
 *
 * @class DataTableArgument
 * @see {@link GherkinAstDataTable}
 */
interface CodeceptJSDataTableArgument {
    /**
     * @property {string[][]} rawData The data as an array of arrays representing the value of the
     *                                data in each cell in the table
     */
    rawData: string[][],

    /**
     * Method to return the data as an array of arrays representing the value of the data in each
     * cell in the table
     *
     * @returns {string[][]} Returns the table as a 2-D array
     */
    raw(): string[][],

    /**
     * Method to return the data as an array of arrays representing the value of the data in each
     * cell in the table, not including the table header row
     *
     * @returns {string[][]} Returns the table as a 2-D array, without the first row
     */
    rows(): string[][],

    /**
     * Method to return the data in the table as an array of objects with the column header as the
     * key 
     *
     * @returns {{ [colName: string]: string }[]} Retruns an array of objects where each row is
     *                                            converted to an object (column header is the key)
     */
    hashes(): { [colName: string]: string }[],
}

/**
 * DataTableArgument representing BDD data read as a relational table
 */
interface CodeceptJSDataTable extends GherkinAstDataTable {

    /**
     * obtain an object that allows you to get a simple version of the table parsed by column or row
     *
     * @returns {CodeceptJSDataTableArgument} Returns a `DataTableArgument` object linking to
     *                                        further methods to iterate through the data
     */
    parse(): CodeceptJSDataTableArgument
}

/**
 * Object representing the response data from the `cleaning-session` API endpoint
 */
interface CleaningResponseObject {
    /**
     * @property {number} patches The number of patches of dirt the robot cleaned up
     */
    patches: number,

    /**
     * @property {number[]} coords The final hoover position (X, Y)
     */
    coords: number[]
}

/**
 * Object representing a "well-formed" request as expected by the `cleaning-session` API endpoint
 */
interface CleaningRequestObject {
    /**
     * @property {number[]} roomSize Room dimensions as 
     *                             {@link https://en.wikipedia.org/wiki/Cartesian_coordinate_system
     *                             X and Y coordinates},
     *                             identifying the top right corner of the room rectangle. This
     *                             room is divided up in a grid based on these dimensions; a room
     *                             that has dimensions X: 5 and Y: 5 has 5 columns and 5 rows, so
     *                             25 possible hoover positions. The bottom left corner is the
     *                             point of origin for our coordinate system, so as the room
     *                             contains all coordinates its bottom left corner is defined by X:
     *                             0 and Y: 0.
     */
    roomSize: number[],

    /**
     * @property {number[]} coords locations of patches of dirt, also defined by X and Y
     *                             coordinates identifying the bottom left corner of those grid
     *                             positions.
     */
    coords: number[],

    /**
     * @property {number[][]} patches an initial hoover position (X and Y coordinates like patches
     *                                of dirt)
     */
    patches: number[][],

    /**
     * @property {string} instructions driving instructions (as 
     *                                 {@link https://en.wikipedia.org/wiki/Cardinal_direction
     *                                 cardinal directions})
     *                                 where e.g. N and E mean "go north" and "go east"
     *                                 respectively)
     */
    instructions: string
}

/**
 * String indexable object with string values that may be undefined
 */
interface NullableLooseObject {
    [key: string]: string | undefined
}

/**
 * String indexable object with unknown value types
 */
interface LooseObject {
    [key: string]: unknown
}

/**
 * Object holding a `ChildProcess` object representing a process that is being managed
 */
interface ProcessInfoHolderObject extends LooseObject {
    /**
     * @property {ChildProcess} process_object Object representing a process that is being managed
     */
    process_object: ChildProcess
}

/**
 * Object representing data that is being persisted accross steps relevant to the test being
 * performed
 */
interface TestState {
    /**
     * @property {LooseObject} request Data object being built which will eventually be used as a
     *                                 request payload in the test
     */
    request: LooseObject,

    // TODO: response could be less loose
    /**
     * @property {LooseObject} response Object representing the API response if it has been
     *                                  received
     */
    response: LooseObject,

    /**
     * @property {ProcessInfoHolderObject} server_process Object holding a `ChildProcess` object
     *                                                    representing the server process that is
     *                                                    being managed
     */
    server_process: ProcessInfoHolderObject | null,

    // Makes object extensible
    [key: string]: LooseObject | null
}

/**
 * Object holding the settings needed to start the server process
 */
interface ServerProcessSettings {
    /**
     * @property {string} execPath The path to the executable file
     */
    execPath: string,

    /**
     * @property {SpawnOptionsWithoutStdio} spawnOpts The options passed to spawn to configure the
     *                                                server process environment
     */
    spawnOpts: SpawnOptionsWithoutStdio
}

/**
 * Object exposing method with which to interact with data for the test object applying to the
 * `allure` plugin
 */
 interface CodeceptJSAllurePlugin {
    /**
     * Add an attachment to current test / suite.  This is meant for general user supplied
     * attachments
     *
     * @param  {string} name The name of the attachment (file name)
     * @param  {any} buffer The content comprising the attachment
     * @param  {string} type The type of the attachment
     * @returns void
     */
    addAttachment(name: string, buffer: any, type: string): void;

    /**
     * Sets a description
     *
     * @param  {string} description The description content
     * @param  {AllureTYPE} type The type of data used for the descript (markdown, html, text)
     * @returns void
     */
    setDescription(description: string, type: AllureTYPE): void

    /**
     * Add a new step
     *
     * @param  {string} name
     * @param  {()=>void} stepFunc
     * @returns void
     */
    createStep(name: string, stepFunc:  () => void): void;

    /**
     * Create an attachment.  This is meant for things like a screen shot on a failure
     *
     * @param  {string} name The name of the attachment (file name)
     * @param  {any} content The content comprising the attachment
     * @param  {string} type The type of the attachment
     * @returns void
     */
    createAttachment(name: string, content: any, type: string): void;

    /**
     * Adds severity label
     *
     * @param  {string} severity The severity level
     * @returns void
     */
    severity(severity: string): void;

    /**
     * Adds epic label
     * 
     * @param  {string} epic The ID of the epic being referenced
     * @returns void
     */
    epic(epic: string): void;

    /**
     * Adds feature label
     *
     * @param  {string} feature The ID of the feature
     * @returns void
     */
    feature(feature: string): void;

    /**
     * Adds story label
     *
     * @param  {string} story The ID of the story
     * @returns void
     */
    story(story: string): void;

    /**
     * Adds issue label
     *
     * @param  {string} issue The ID of the issue
     * @returns void
     */
    issue(issue: string): void;

    /**
     * Adds a label to current test
     *
     * @param  {string} name The label name (or type)
     * @param  {string} value Teh value for the label
     * @returns void
     */
    addLabel(name: string, value: string): void;

    /**
     * Adds a parameter to current test
     *
     * @param  {any} kind Type of the parameter
     * @param  {string} name Name of the parameter
     * @param  {string} value Value of the parameter
     * @returns void
     */
    addParameter(kind: any, name: string, value: string): void;
}

export {
    NullableLooseObject, LooseObject, ProcessInfoHolderObject, TestState,
    CodeceptJSDataTable, CodeceptJSDataTableArgument, CleaningResponseObject,
    CodeceptJSAllurePlugin, GherkinAstObject, GherkinAstRule, GherkinAstTableCell,
    GherkinAstTableRow, GherkinAstDataTable, CleaningRequestObject, ServerProcessSettings,
    GherkinTextSpan, GherkinLocation, GherkinLine
};

/**
 * This is a work-around for codeceptjs using this type, but it no longer being defined by
 * webdriverio.  It gets patched in here when this module is included so the transpiler
 * will work.
 */
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace WebdriverIO {
        /**
         * Defines w3c timeout data
         */
        interface Timeouts {
            implicit?: number,
            pageLoad?: number,
            script?: number
        }
    }
}