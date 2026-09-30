import { createAction, InputPropertyMap, Property } from '@activepieces/pieces-framework';
import { QueryResult } from 'pg';
import { postgresAuth } from '../..';
import { pgClient, PostgresColumn, postgresCommon, postgresUtils } from '../common';
import { insertRowsOutputSchema } from '../output-schemas';

export const insertRows = createAction({
  auth: postgresAuth,
  name: 'insert-rows',
  classification: 'WRITE',
  displayName: 'Insert Multiple Rows',
  description: 'Inserts many rows into a table in a single transaction',
  audience: 'both',
  outputSchema: insertRowsOutputSchema,
  aiMetadata: {
    description: 'Inserts an array of rows into a PostgreSQL table, each row a map of column names to values, using multi-row INSERT statements inside one transaction: if any row fails, none are inserted. Columns a row omits get the column default. Returns the inserted count and, when Return Inserted Rows is on, the stored rows including generated ids. Use instead of repeated single inserts for bulk loads. Not idempotent: each call appends new rows, so repeating it adds duplicates or errors on a unique-key collision.',
    idempotent: false,
  },
  props: {
    table: postgresCommon.table,
    batch: Property.DynamicProperties({
      auth: postgresAuth,
      displayName: 'Rows',
      required: true,
      refreshers: ['table'],
      props: async ({ auth, table }): Promise<InputPropertyMap> => {
        if (!auth || !postgresUtils.isPostgresTable(table)) {
          return {};
        }
        const client = await pgClient(auth);
        try {
          const columns = await postgresUtils.listColumnDetails({ client, table });
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
          await client.end();
        }
      },
    }),
    keep_empty_strings: Property.Checkbox({
      displayName: 'Keep Empty Strings',
      description: 'Insert empty fields as empty strings instead of the column default.',
      required: false,
      defaultValue: false,
    }),
    return_rows: Property.Checkbox({
      displayName: 'Return Inserted Rows',
      description: 'Return the inserted rows, including generated ids. Needs SELECT permission on the table.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { table, batch, keep_empty_strings, return_rows } = context.propsValue;
    const submittedRecords = insertRowsUtils.toRecords({ rows: batch?.['rows'], keepEmptyStrings: keep_empty_strings === true });
    insertRowsUtils.collectColumns({ records: submittedRecords });

    const client = await pgClient(context.auth);
    client.on('error', () => undefined);
    try {
      const tableColumns = await postgresUtils.listColumnDetails({ client, table });
      const records = insertRowsUtils.parseArrayColumns({ records: submittedRecords, tableColumns });
      const statements = insertRowsUtils.buildStatements({
        qualifiedTable: postgresUtils.qualifiedName(table),
        columns: insertRowsUtils.collectColumns({ records }),
        records,
        returnRows: return_rows === true,
      });
      await client.query('BEGIN');
      const results: QueryResult[] = [];
      for (const statement of statements) {
        results.push(await client.query(statement.text, statement.values));
      }
      await client.query('COMMIT');
      const rowCount = results.reduce((total, result) => total + (result.rowCount ?? 0), 0);
      return return_rows === true
        ? { rows: results.flatMap((result) => result.rows), rowCount }
        : { rowCount };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Insert failed and the whole batch was rolled back: ${reason}`);
    } finally {
      await client.end();
    }
  },
});

function isRequiredColumn({ column }: { column: PostgresColumn }): boolean {
  const isFilledByDatabase = column.column_default !== null || column.is_identity === 'YES' || column.is_generated === 'ALWAYS';
  return column.is_nullable === 'NO' && !isFilledByDatabase;
}

function describeColumn({ column }: { column: PostgresColumn }): string {
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

function parseArrayColumns({ records, tableColumns }: { records: Record<string, unknown>[]; tableColumns: PostgresColumn[] }): Record<string, unknown>[] {
  const arrayColumns = new Set(tableColumns.filter((column) => column.data_type === 'ARRAY').map((column) => column.column_name));
  if (arrayColumns.size === 0) {
    return records;
  }
  return records.map((record) => Object.fromEntries(
    Object.entries(record).map(([column, value]) => [column, arrayColumns.has(column) ? parseJsonArray({ value }) : value]),
  ));
}

function parseJsonArray({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string' || !value.trimStart().startsWith('[')) {
    return value;
  }
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : value;
  } catch {
    return value;
  }
}

function collectColumns({ records }: { records: Record<string, unknown>[] }): string[] {
  const columns = [...new Set(records.flatMap((record) => Object.keys(record)))];
  if (columns.length === 0) {
    throw new Error('Rows must contain at least one column.');
  }
  return columns;
}

function buildStatements({ qualifiedTable, columns, records, returnRows }: {
  qualifiedTable: string;
  columns: string[];
  records: Record<string, unknown>[];
  returnRows: boolean;
}): InsertStatement[] {
  const rowsPerStatement = Math.max(1, Math.min(MAX_ROWS_PER_STATEMENT, Math.floor(MAX_PARAMETERS / columns.length)));
  const quotedColumns = columns.map((column) => postgresUtils.quoteIdentifier(column)).join(', ');
  const suffix = returnRows ? ' RETURNING *' : '';

  return splitIntoBatches({ records, maxRows: rowsPerStatement }).map((batch) => {
    const values: unknown[] = [];
    const tuples = batch.map((record) => {
      const placeholders = columns.map((column) => {
        const value = record[column];
        if (value === undefined) {
          return 'DEFAULT';
        }
        values.push(value);
        return `$${values.length}`;
      });
      return `(${placeholders.join(', ')})`;
    });
    return {
      text: `INSERT INTO ${qualifiedTable} (${quotedColumns}) VALUES ${tuples.join(', ')}${suffix}`,
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
  parseArrayColumns,
  buildStatements,
};

export type InsertStatement = {
  text: string;
  values: unknown[];
};
