import { createAction, Property } from '@activepieces/pieces-framework';
import format from 'pg-format';
import { postgresAuth } from '../../../auth';
import { postgresAi, postgresAiProps } from '../../../ai-common';
import { postgresInsertRowsOutputSchema } from '../../../output-schemas';

export const insertRowsAi = createAction({
  auth: postgresAuth,
  name: 'postgres_insert_rows',
  outputSchema: postgresInsertRowsOutputSchema,
  displayName: 'Insert Rows',
  description: 'Inserts one or more rows into a table and returns them as stored.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: `Inserts a list of rows (objects of column name to value) in one statement, so either all rows are inserted or none. Columns a row leaves out get their default, and the stored rows come back with generated ids and defaults. Up to ${postgresAi.INSERT_MAX_ROWS} rows per call. Not idempotent: repeating adds duplicates or fails on a unique key; use Upsert Row to insert-or-update by key. Column names come from Describe Table.`,
    idempotent: false,
  },
  props: {
    table: postgresAiProps.table,
    rows: Property.Json({
      displayName: 'Rows',
      description: 'A list of objects, one per row, e.g. [{"email": "ada@example.com", "name": "Ada"}]. For a json or jsonb column holding a list, pass the list as a JSON string.',
      required: true,
    }),
  },
  async run(context) {
    const { table } = context.propsValue;
    const records = toRecords({ rows: context.propsValue.rows });
    const columns = [...new Set(records.flatMap((record) => Object.keys(record)))];
    if (columns.length === 0 && records.length > 1) {
      throw new Error('Every row is empty; give at least one column per row, or insert one empty row at a time.');
    }
    const values: unknown[] = [];
    const tuples = records.map((record) => `(${columns.map((column) => {
      if (!(column in record)) {
        return 'DEFAULT';
      }
      values.push(record[column]);
      return `$${values.length}`;
    }).join(', ')})`);
    if (values.length > MAX_PARAMETERS) {
      throw new Error(`These rows need ${values.length} values, more than Postgres accepts in one statement (${MAX_PARAMETERS}). Split them into smaller calls.`);
    }
    const target = columns.length > 0
      ? ` (${columns.map((column) => format.ident(column)).join(', ')}) VALUES ${tuples.join(', ')}`
      : ' DEFAULT VALUES';
    const result = await postgresAi.withClient({
      auth: context.auth,
      fn: (client) => client.query(`INSERT INTO ${postgresAi.quoteName({ name: table })}${target} RETURNING *`, values),
    });
    return { rows: result.rows, rowCount: result.rowCount ?? 0 };
  },
});

function toRecords({ rows }: { rows: unknown }): Record<string, unknown>[] {
  const list = typeof rows === 'string' ? parseRows({ text: rows }) : rows;
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error('Rows must be a non-empty list of objects, e.g. [{"name": "Ada"}].');
  }
  if (list.length > postgresAi.INSERT_MAX_ROWS) {
    throw new Error(`Rows has ${list.length} entries; insert at most ${postgresAi.INSERT_MAX_ROWS} per call.`);
  }
  return list.map((row, index) => {
    if (!postgresAi.isRecord(row)) {
      throw new Error(`Row ${index + 1} must be an object of column name to value.`);
    }
    return row;
  });
}

function parseRows({ text }: { text: string }): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Rows must be valid JSON: a list of objects.');
  }
}

const MAX_PARAMETERS = 65535;
