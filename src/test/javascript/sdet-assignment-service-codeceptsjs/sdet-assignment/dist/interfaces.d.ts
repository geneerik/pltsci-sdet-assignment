/**
 * Module to hold the custom Interfaces to be used by the library.
 *
 * @module sdet-assignment
 */
/// <reference types="node" />
import { ChildProcess } from "child_process";
import { TYPE as AllureTYPE } from "allure-js-commons";
/**
 * Object representing a line in a Gherkin document
 *
 * @class GherkinLine
 */
interface GherkinLine {
    /**
     * @property {string} lineText The text this object points to
     */
    lineText: string;
    /**
     * @property {number} lineNumber The line number on which `lineText` was observed
     */
    lineNumber: number;
    /**
     * @property {string} trimmedLineText The value of `lineText` after trimming white spaces
     */
    trimmedLineText: string;
    /**
     * @property {boolean} isEmpty Whether or not this is an empty line
     */
    isEmpty: boolean;
    /**
     * @property {number} indent The number of characters of indentation before the start of
     *                           `trimmedLineText`
     */
    indent: number;
}
/**
 * Object representing the location in a Gherkin document in which a `GherkinAstObject` was observed
 */
interface GherkinLocation {
    /**
     * @property The line on which the `GherkinAstObject` was observed
     */
    line: GherkinLine;
    /**
     * @property The column number in the `line` on which the `GherkinAstObject` was observed
     */
    column: number;
}
/**
 * Object representing data parsed from a gherkin document
 */
interface GherkinAstObject {
    /**
     * @property {string} type The name of the object type
     */
    type: string;
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
    location: GherkinLocation;
}
/**
 * Object resenting a data cell in a `GherkinAstTableRow`
 *
 * @extends GherkinAstRule
 * @see {@link GherkinAstTableRow}
 */
interface GherkinAstTableCell extends GherkinAstRule {
    type: "TableCell";
    /**
     * @property {string} value The value of the data in the cell
     */
    value: string;
}
/**
 * Object resenting a data row in a `GherkinAstDataTable`
 *
 * @extends GherkinAstRule
 * @see {@link GherkinAstDataTable}
 */
interface GherkinAstTableRow extends GherkinAstRule {
    type: "TableRow";
    /**
     *
     */
    cells: GherkinAstTableCell[];
}
/**
 * Object representing a table of data observed in a Gherkin document
 *
 * @extends GherkinAstRule
 */
interface GherkinAstDataTable extends GherkinAstRule {
    type: "DataTable";
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
    rawData: string[][];
    /**
     * Method to return the data as an array of arrays representing the value of the data in each
     * cell in the table
     *
     * @returns {string[][]} Returns the table as a 2-D array
     */
    raw(): string[][];
    /**
     * Method to return the data as an array of arrays representing the value of the data in each
     * cell in the table, not including the table header row
     *
     * @returns {string[][]} Returns the table as a 2-D array, without the first row
     */
    rows(): string[][];
    /**
     * Method to return the data in the table as an array of objects with the column header as the
     * key
     *
     * @returns {{ [colName: string]: string }[]} Retruns an array of objects where each row is
     *                                            converted to an object (column header is the key)
     */
    hashes(): {
        [colName: string]: string;
    }[];
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
    parse(): CodeceptJSDataTableArgument;
}
/**
 * Object representing the response data from the `cleaning-session` API endpoint
 */
interface CleaningResponseObject {
    /**
     * @property {number} patches The number of patches of dirt the robot cleaned up
     */
    patches: number;
    /**
     * @property {number[]} coords The final hoover position (X, Y)
     */
    coords: number[];
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
    roomSize: number[];
    /**
     * @property {number[]} coords locations of patches of dirt, also defined by X and Y
     *                             coordinates identifying the bottom left corner of those grid
     *                             positions.
     */
    coords: number[];
    /**
     * @property {number[][]} patches an initial hoover position (X and Y coordinates like patches
     *                                of dirt)
     */
    patches: number[][];
    /**
     * @property {string} instructions driving instructions (as
     *                                 {@link https://en.wikipedia.org/wiki/Cardinal_direction
     *                                 cardinal directions})
     *                                 where e.g. N and E mean "go north" and "go east"
     *                                 respectively)
     */
    instructions: string;
}
/**
 * String indexable object with string values that may be undefined
 */
interface NullableLooseObject {
    [key: string]: string | undefined;
}
/**
 * String indexable object with unknown value types
 */
interface LooseObject {
    [key: string]: unknown;
}
/**
 * Object holding a `ChildProcess` object representing a process that is being managed
 */
interface ProcessInfoHolderObject extends LooseObject {
    /**
     * @property {ChildProcess} process_object Object representing a process that is being managed
     */
    process_object: ChildProcess;
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
    request: LooseObject;
    /**
     * @property {LooseObject} response Object representing the API response if it has been
     *                                  received
     */
    response: LooseObject;
    /**
     * @property {ProcessInfoHolderObject} server_process Object holding a `ChildProcess` object
     *                                                    representing the server process that is
     *                                                    being managed
     */
    server_process: ProcessInfoHolderObject | null;
    [key: string]: LooseObject | null;
}
/**
 * Object exposing method with which to interact with data for the test object applying to the
 * `allure` plugin
 */
interface CodeceptJSAllurePlugin {
    addAttachment(name: string, buffer: any, type: string): void;
    setDescription(description: string, type: AllureTYPE): void;
    createStep(name: string, stepFunc: () => void): void;
    createAttachment(name: string, content: any, type: string): void;
    severity(severity: string): void;
    epic(epic: string): void;
    feature(feature: string): void;
    story(story: string): void;
    issue(issue: string): void;
    addLabel(name: string, value: string): void;
    addParameter(kind: any, name: string, value: string): void;
}
export { NullableLooseObject, LooseObject, ProcessInfoHolderObject, TestState, CodeceptJSDataTable, CodeceptJSDataTableArgument, CleaningResponseObject, CodeceptJSAllurePlugin, GherkinAstObject, GherkinAstRule, GherkinAstTableCell, GherkinAstTableRow, GherkinAstDataTable, CleaningRequestObject };
