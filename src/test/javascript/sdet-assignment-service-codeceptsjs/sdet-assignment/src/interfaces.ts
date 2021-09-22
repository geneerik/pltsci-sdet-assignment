/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChildProcess } from "child_process";
import { TYPE as AllureTYPE } from "allure-js-commons";

interface CodeceptJSDataTableArgument {
  /**
   * returns the table as a 2-D array
   */
  raw(): string[][],
  /**
   * returns the table as a 2-D array, without the first row
   */
  rows(): string[][],
  /**
   * returns an array of objects where each row is converted to an object (column header is the key)
   */
  hashes(): { [colName: string]: string }[],
}

interface CodeceptJSDataTable {
    /**
     * obtain an object that allows you to get a simple version of the table parsed by column or row
     */
    parse(): CodeceptJSDataTableArgument
    rows: { [id: number]: { cells: { value: string }[] } };
}

interface CleaningResponseObject {
    patches:number,
    coords:number[]
}

interface CodeceptJSAllurePlugin{
    addAttachment(name: string, buffer: any, type: string): void;
    setDescription(description: string, type: AllureTYPE): void
    createStep(name: string, stepFunc:  () => void): void;
    createAttachment(name: string, content: any, type: string): void;
    severity(severity: string): void;
    epic(epic: string): void;
    feature(feature: string): void;
    story(story: string): void;
    issue(issue: string): void;
    addLabel(name: string, value: string): void;
    addParameter(kind: any, name: string, value: string): void;
}

interface NullableLooseObject {
    [key: string]: string | null
}

interface LooseObject {
    [key: string]: unknown
}

interface ProcessInfoHolderObject extends LooseObject {
    process_object: ChildProcess
}

interface TestState {
    request: LooseObject,
    // TODO: response could be less loose
    response: LooseObject,
    server_process: ProcessInfoHolderObject | null,
    [key: string]: LooseObject | null
}

export {
    NullableLooseObject, LooseObject, ProcessInfoHolderObject, TestState,
    CodeceptJSDataTable, CodeceptJSDataTableArgument, CleaningResponseObject,
    CodeceptJSAllurePlugin
};