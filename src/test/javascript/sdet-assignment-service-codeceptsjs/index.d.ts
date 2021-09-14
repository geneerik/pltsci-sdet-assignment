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
