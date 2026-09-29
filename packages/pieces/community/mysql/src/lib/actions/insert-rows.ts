import { createAction, InputPropertyMap, Property } from '@activepieces/pieces-framework';
import { mysqlAuth } from '../..';
import { MysqlColumn, mysqlCommon, mysqlConnect, mysqlGetColumns, sanitizeColumnName } from '../common';
import { insertRowsOutputSchema } from '../output-schemas';

export const insertRows = createAction({
  auth: mysqlAuth,
  name: 'insert_rows',
  classification: 'WRITE',
  displayName: 'Insert Multiple Rows',
  description: 'Inserts many rows into a table in a single transaction',
  audience: 'both',
  outputSchema: insertRowsOutputSchema,
  aiMetadata: {
    description: 'Inserts an array of rows into a MySQL table, each row a map of column names to values, using multi-row INSERT statements inside one transaction: if any row fails, none are inserted (InnoDB tables only). Columns a row omits get the column default. Returns the inserted row count and the auto-increment id of the first inserted row. Use instead of repeated single inserts for bulk loads. Not idempotent: each call appends new rows, so repeating it adds duplicates or errors on a unique-key collision.',
    idempotent: false,
  },
  props: {
    timezone: mysqlCommon.timezone,
    table: mysqlCommon.table(),
    batch: Property.DynamicProperties({
      auth: mysqlAuth,
      displayName: 'Rows',
      required: true,
      refreshers: ['table'],
      props: async ({ auth, table }): Promise<InputPropertyMap> => {
        if (!auth || typeof table !== 'string' || table === '') {
          return {};
        }
        const conn = await mysqlConnect(auth, {});
        try {
          const columns = await mysqlGetColumns({ conn, table });
          return {
            rows: Property.Array({
              displayName: 'Rows',
              description: 'One item per row. Leave a field empty to use the column default.',
              required: true,
              properties: Object.fromEntries(
                columns.map((column) => [
                  column.column_name,
                  Property.ShortText({
                    displayName: column.column_name,
                    description: describeColumn({ column }),
                    required: isRequiredColumn({ column }),
                  }),
                ]),
              ),
            }),
          };
        } finally {
          await conn.end();
        }
      },
    }),
    keep_empty_strings: Property.Checkbox({
      displayName: 'Keep Empty Strings',
      description: 'Insert empty fields as empty strings instead of the column default.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { table, batch, keep_empty_strings } = context.propsValue;
    const records = insertRowsUtils.toRecords({ rows: batch?.['rows'], keepEmptyStrings: keep_empty_strings === true });
    const columns = insertRowsUtils.collectColumns({ records });
    const statements = insertRowsUtils.buildStatements({
      quotedTable: sanitizeColumnName(table),
      columns,
      records,
    });

    const conn = await mysqlConnect(context.auth, context.propsValue);
    conn.on('error', () => undefined);
    try {
      await conn.beginTransaction();
      const results: MysqlWriteResult[] = [];
      for (const statement of statements) {
        results.push(await conn.query(statement.text, statement.values));
      }
      await conn.commit();
      return {
        affectedRows: results.reduce((total, result) => total + result.affectedRows, 0),
        firstInsertId: results[0]?.insertId ?? 0,
      };
    } catch (error) {
      await conn.rollback().catch(() => undefined);
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Insert failed and the whole batch was rolled back: ${reason}`);
    } finally {
      await conn.end().catch(() => conn.destroy());
    }
  },
});

function isRequiredColumn({ column }: { column: MysqlColumn }): boolean {
  const isFilledByDatabase =
    column.column_default !== null ||
    column.extra.includes('auto_increment') ||
    /(VIRTUAL|STORED) GENERATED/.test(column.extra);
  return column.is_nullable === 'NO' && !isFilledByDatabase;
}

function describeColumn({ column }: { column: MysqlColumn }): string {
  return isRequiredColumn({ column }) ? `${column.data_type} · required` : column.data_type;
}

function toRecords({ rows, keepEmptyStrings }: { rows: unknown; keepEmptyStrings: boolean }): Record<string, unknown>[] {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Rows must be a non-empty array of objects.');
  }
  return rows.map((row, index) => {
    if (typeof row !== 'object' || row === null || Array.isArray(row)) {
      throw new Error(`Row ${index + 1} must be an object of column names mapped to values.`);
    }
    return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined && (keepEmptyStrings || value !== '')));
  });
}

function collectColumns({ records }: { records: Record<string, unknown>[] }): string[] {
  const columns = [...new Set(records.flatMap((record) => Object.keys(record)))];
  if (columns.length === 0) {
    throw new Error('Rows must contain at least one column.');
  }
  return columns;
}

function toBindValue(value: unknown): unknown {
  const isStructured = typeof value === 'object' && value !== null && !(value instanceof Date) && !Buffer.isBuffer(value);
  return isStructured ? JSON.stringify(value) : value;
}

function buildStatements({ quotedTable, columns, records }: {
  quotedTable: string;
  columns: string[];
  records: Record<string, unknown>[];
}): InsertStatement[] {
  const rowsPerStatement = Math.max(1, Math.min(MAX_ROWS_PER_STATEMENT, Math.floor(MAX_PARAMETERS / columns.length)));
  const quotedColumns = columns.map((column) => sanitizeColumnName(column)).join(', ');

  return splitIntoBatches({ records, maxRows: rowsPerStatement }).map((batch) => {
    const values: unknown[] = [];
    const tuples = batch.map((record) => {
      const placeholders = columns.map((column) => {
        const value = record[column];
        if (value === undefined) {
          return 'DEFAULT';
        }
        values.push(toBindValue(value));
        return '?';
      });
      return `(${placeholders.join(', ')})`;
    });
    return {
      text: `INSERT INTO ${quotedTable} (${quotedColumns}) VALUES ${tuples.join(', ')}`,
      values,
    };
  });
}

function splitIntoBatches({
  records,
  maxRows,
}: {
  records: Record<string, unknown>[];
  maxRows: number;
}): Record<string, unknown>[][] {
  const batches: Record<string, unknown>[][] = [];
  let current: Record<string, unknown>[] = [];
  let currentBytes = 0;
  for (const record of records) {
    const bytes = estimateBytes({ record });
    const isFull =
      current.length >= maxRows || currentBytes + bytes > MAX_STATEMENT_BYTES;
    if (current.length > 0 && isFull) {
      batches.push(current);
      current = [];
      currentBytes = 0;
    }
    current.push(record);
    currentBytes += bytes;
  }
  return current.length > 0 ? [...batches, current] : batches;
}

function estimateBytes({ record }: { record: Record<string, unknown> }): number {
  return Object.values(record).reduce<number>(
    (total, value) => total + sizeOf({ value }),
    0
  );
}

function sizeOf({ value }: { value: unknown }): number {
  if (typeof value === 'string') {
    return Buffer.byteLength(value);
  }
  if (Buffer.isBuffer(value)) {
    return value.length;
  }
  if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
    return Buffer.byteLength(JSON.stringify(value));
  }
  return 16;
}

const MAX_PARAMETERS = 65535;
const MAX_ROWS_PER_STATEMENT = 1000;
const MAX_STATEMENT_BYTES = 1024 * 1024;

export const insertRowsUtils = {
  toRecords,
  collectColumns,
  buildStatements,
};

export type InsertStatement = {
  text: string;
  values: unknown[];
};

type MysqlWriteResult = {
  affectedRows: number;
  insertId: number;
};
