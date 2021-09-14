import { TYPE as AllureTYPE } from "allure-js-commons";

interface DataTableArgument {
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

interface DataTable {
    /**
     * obtain an object that allows you to get a simple version of the table parsed by column or row
     */
    parse(): DataTableArgument
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
