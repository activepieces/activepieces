import { createAction, InputPropertyMap, Property } from '@activepieces/pieces-framework';
import sql from 'mssql';
import { mssqlAuth } from '../auth';
import { mssqlCommon, MssqlColumnDetail } from '../common';
import { cursorUtils } from '../common/cursor';
import { mssqlProps } from '../common/props';
import { insertRowsActionOutputSchema } from '../output-schemas';

export const insertRowsAction = createAction({
  auth: mssqlAuth,
  name: 'insert_rows',
  classification: 'WRITE',
  displayName: 'Insert Multiple Rows',
  description: 'Inserts many rows into a table in a single transaction',
  audience: 'both',
  aiMetadata: {
    description:
      'Inserts an array of rows into a SQL Server table, each row a map of column names to values, using multi-row INSERT statements inside one transaction: if any row fails, none are inserted. Columns a row omits get the column default. Returns the inserted row count and, when Return Inserted Rows is on, the stored rows including IDENTITY ids. Use instead of repeated single inserts for bulk loads. Not idempotent: each call appends new rows, so repeating it adds duplicates or fails on a unique-key collision.',
    idempotent: false,
  },
  props: {
    table: mssqlProps.table(),
    batch: Property.DynamicProperties({
      auth: mssqlAuth,
      displayName: 'Rows',
      required: true,
      refreshers: ['table'],
      props: async ({ auth, table }): Promise<InputPropertyMap> => {
        const target = mssqlProps.asTable(table);
        if (!auth || target === null) {
          return {};
        }
        const pool = await mssqlCommon.connect({ auth });
        try {
          const columns = await mssqlCommon.getColumnDetails({ pool, table: target });
          return {
            rows: Property.Array({
              displayName: 'Rows',
              description:
                'One item per row. Leave a field empty to use the column default.',
              required: true,
              properties: Object.fromEntries(
                columns.map((column) => [
                  column.name,
                  Property.ShortText({
                    displayName: column.name,
                    description: describeColumn({ column }),
                    required: isRequiredColumn({ column }),
                  }),
                ])
              ),
            }),
          };
        } finally {
          await pool.close().catch(() => undefined);
        }
      },
    }),
    keep_empty_strings: Property.Checkbox({
      displayName: 'Keep Empty Strings',
      description:
        'Insert empty fields as empty strings instead of the column default.',
      required: false,
      defaultValue: false,
    }),
    return_rows: Property.Checkbox({
      displayName: 'Return Inserted Rows',
      description:
        'Return the inserted rows, including identity ids. Fails on tables with triggers.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: insertRowsActionOutputSchema,
  async run(context) {
    const { table, batch, keep_empty_strings, return_rows } = context.propsValue;
    const records = insertRowsUtils.toRecords({
      rows: batch?.['rows'],
      keepEmptyStrings: keep_empty_strings === true,
    });
    const columns = insertRowsUtils.collectColumns({ records });
    const target = mssqlCommon.quoteTable(table);

    const pool = await mssqlCommon.connect({ auth: context.auth });
    pool.on('error', () => undefined);
    try {
      const output =
        return_rows === true
          ? `OUTPUT ${cursorUtils.exactProjection({
              columns: (await mssqlCommon.getTableMeta({ pool, table })).columns,
              prefix: 'INSERTED',
            })}`
          : '';
      const statements = insertRowsUtils.buildStatements({
        quotedTable: target,
        columns,
        records,
        output,
      });
      const results = await runInTransaction({ pool, statements, target });
      const rowCount = results.reduce(
        (total, result) => total + sumOf({ counts: result.rowsAffected }),
        0
      );
      return return_rows === true
        ? { rows: results.flatMap((result) => result.recordset ?? []), row_count: rowCount }
        : { row_count: rowCount };
    } finally {
      await pool.close().catch(() => undefined);
    }
  },
});

async function runInTransaction({
  pool,
  statements,
  target,
}: {
  pool: sql.ConnectionPool;
  statements: InsertStatement[];
  target: string;
}): Promise<sql.IResult<Record<string, unknown>>[]> {
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const results: sql.IResult<Record<string, unknown>>[] = [];
    for (const statement of statements) {
      const request = transaction.request();
      statement.values.forEach((value, index) =>
        request.input(`p${index}`, value)
      );
      results.push(await request.query<Record<string, unknown>>(statement.text));
    }
    await transaction.commit();
    return results;
  } catch (error) {
    await transaction.rollback().catch(() => undefined);
    if (mssqlCommon.isOutputBlockedByTrigger(error)) {
      throw new Error(
        `${target} has enabled triggers, so SQL Server refuses to return the inserted rows. Turn off Return Inserted Rows and the batch will insert normally.`
      );
    }
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Insert failed and the whole batch was rolled back: ${reason}`
    );
  }
}

function sumOf({ counts }: { counts: number[] | undefined }): number {
  return (counts ?? []).reduce((total, count) => total + count, 0);
}

function isRequiredColumn({ column }: { column: MssqlColumnDetail }): boolean {
  const isFilledByDatabase =
    column.hasDefault ||
    column.isIdentity ||
    column.isComputed ||
    column.typeName === 'timestamp';
  return !column.isNullable && !isFilledByDatabase;
}

function describeColumn({ column }: { column: MssqlColumnDetail }): string {
  return isRequiredColumn({ column })
    ? `${column.typeName} · required`
    : column.typeName;
}

function toRecords({
  rows,
  keepEmptyStrings,
}: {
  rows: unknown;
  keepEmptyStrings: boolean;
}): Record<string, unknown>[] {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Rows must be a non-empty array of objects.');
  }
  return rows.map((row, index) => {
    if (typeof row !== 'object' || row === null || Array.isArray(row)) {
      throw new Error(
        `Row ${index + 1} must be an object of column names mapped to values.`
      );
    }
    return Object.fromEntries(
      Object.entries(row).filter(
        ([, value]) => value !== undefined && (keepEmptyStrings || value !== '')
      )
    );
  });
}

function collectColumns({
  records,
}: {
  records: Record<string, unknown>[];
}): string[] {
  const columns = [
    ...new Set(records.flatMap((record) => Object.keys(record))),
  ];
  if (columns.length === 0) {
    throw new Error('Rows must contain at least one column.');
  }
  if (columns.length > MAX_PARAMETERS) {
    throw new Error(
      `Rows use ${columns.length} columns, but SQL Server allows at most ${MAX_PARAMETERS} parameters per statement.`
    );
  }
  return columns;
}

function toBindValue(value: unknown): unknown {
  const isStructured =
    typeof value === 'object' &&
    value !== null &&
    !(value instanceof Date) &&
    !Buffer.isBuffer(value);
  return isStructured ? JSON.stringify(value) : value;
}

function buildStatements({
  quotedTable,
  columns,
  records,
  output,
}: {
  quotedTable: string;
  columns: string[];
  records: Record<string, unknown>[];
  output: string;
}): InsertStatement[] {
  const rowsPerStatement = Math.min(
    MAX_ROWS_PER_STATEMENT,
    Math.floor(MAX_PARAMETERS / columns.length)
  );
  const quotedColumns = columns
    .map((column) => mssqlCommon.quoteId(column))
    .join(', ');

  return splitIntoBatches({ records, maxRows: rowsPerStatement }).map((batch) => {
    const values: unknown[] = [];
    const tuples = batch.map((record) => {
      const placeholders = columns.map((column) => {
        const value = record[column];
        if (value === undefined) {
          return 'DEFAULT';
        }
        values.push(toBindValue(value) ?? null);
        return `@p${values.length - 1}`;
      });
      return `(${placeholders.join(', ')})`;
    });
    return {
      text: `INSERT INTO ${quotedTable} (${quotedColumns}) ${output} VALUES ${tuples.join(', ')}`,
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

const MAX_PARAMETERS = 2098;
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
