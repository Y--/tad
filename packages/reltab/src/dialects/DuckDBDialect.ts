import { ColumnType, CoreColumnTypes, ColumnTypeMap } from "../ColumnType";
import { BaseSQLDialect } from "../BaseSQLDialect";
import { isNode } from "environ";

const intCT = new ColumnType("INTEGER", "integer");
const realCT = new ColumnType("DOUBLE", "real");
const textCT = new ColumnType("VARCHAR", "string");
const boolCT = new ColumnType("BOOL", "boolean");

const timestampCT = new ColumnType("TIMESTAMP", "timestamp", {
  stringRender: (val: any) => {
    if (val == null) {
      return "";
    }
    let retStr: string;
    try {
      retStr = new Date(val).toISOString();
    } catch (err) {
      if (err instanceof RangeError) {
        console.info(
          "*** DuckDbDialect: Error converting Invalid time value: ",
          val
        );
      } else {
        console.warn(
          "*** DuckDbDialect: Error converting timestamp: ",
          val,
          err
        );
      }
      // Not a lot of great choices here; we'll render as the raw numeric timestamp value
      retStr = String(val);
    }
    return retStr;
  },
});

const blobCT = new ColumnType("BLOB", "blob", {
  stringRender: (val: any) => {
    if (val == null) {
      return "";
    }
    if (isNode() && val instanceof Buffer) {
      return val.toString();
    }
    if (val instanceof Uint8Array) {
      const decoder = new TextDecoder();
      return decoder.decode(val);
    }
    return JSON.stringify(val);
  },
});

export class DuckDBDialectClass extends BaseSQLDialect {
  private static instance: DuckDBDialectClass;
  readonly dialectName: string = "duckdb";
  readonly requireSubqueryAlias: boolean = true;
  readonly coreColumnTypes: CoreColumnTypes = {
    integer: intCT,
    real: realCT,
    string: textCT,
    boolean: boolCT,
  };

  readonly columnTypes: ColumnTypeMap = {
    INTEGER: intCT,
    BIGINT: intCT,
    HUGEINT: intCT,
    DECIMAL: realCT,
    DOUBLE: realCT,
    REAL: realCT,
    FLOAT: realCT,
    TEXT: textCT,
    TIMESTAMP: timestampCT,
    VARCHAR: textCT,
    BOOL: boolCT,
    BOOLEAN: boolCT,
    BLOB: blobCT,
  };

  /*
   * DuckDb seems to support either single or double quote for quoting of columns.
   * While double quotes are most standard, DuckDb will sometimes generate column names that
   * have embedded double quotes without escaping them. For example:
   *   CREATE TABLE t1 AS select hour(timestamp) FROM t0
   * will generate a column in t1 named 'hour("timestamp")'.
   */
  quoteCol(cid: string): string {
    return `'${cid}'`;
  }

  static getInstance(): DuckDBDialectClass {
    if (!DuckDBDialectClass.instance) {
      DuckDBDialectClass.instance = new DuckDBDialectClass();
    }
    return DuckDBDialectClass.instance;
  }
}

export const DuckDBDialect = DuckDBDialectClass.getInstance();
