import { createAction, Property } from '@activepieces/pieces-framework';
import format from 'pg-format';
import { postgresAuth } from '../../../auth';
import { postgresAi, postgresAiProps } from '../../../ai-common';
import { postgresUpsertRowOutputSchema } from '../../../output-schemas';

export const upsertRow = createAction({
  auth: postgresAuth,
  name: 'postgres_upsert_row',
  outputSchema: postgresUpsertRowOutputSchema,
  displayName: 'Upsert Row',
  description: 'Inserts a row, or updates it when a row with the same key already exists.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Inserts a row, or when a row with the same Conflict Columns values exists, updates it instead (INSERT ... ON CONFLICT). Conflict Columns must match a primary key or unique index (List Indexes shows them) and be present in Values. Returns the stored row and whether it was inserted. Repeating with the same values leaves the same row, so it is safe to retry.',
    idempotent: true,
  },
  props: {
    table: postgresAiProps.table,
    values: Property.Object({
      displayName: 'Values',
      description: 'Column names mapped to values, including the conflict columns, e.g. {"email": "ada@example.com", "name": "Ada"}.',
      required: true,
    }),
    conflictColumns: Property.Array({
      displayName: 'Conflict Columns',
      description: 'The columns of a primary key or unique index that identify an existing row, e.g. ["email"].',
      required: true,
    }),
    updateColumns: Property.Array({
      displayName: 'Update Columns',
      description: 'Columns to overwrite when the row already exists. Leave empty to overwrite every column in Values except the conflict columns.',
      required: false,
    }),
  },
  async run(context) {
    const { table } = context.propsValue;
    const values = postgresAi.parseValues({ value: context.propsValue.values, label: 'Values' });
    const columns = Object.keys(values);
    const conflict = (context.propsValue.conflictColumns ?? []).map((column) => String(column));
    if (conflict.length === 0) {
      throw new Error('Conflict Columns needs at least one column.');
    }
    const requested = (context.propsValue.updateColumns ?? []).map((column) => String(column));
    const missing = [...conflict, ...requested].filter((column) => !columns.includes(column));
    if (missing.length > 0) {
      throw new Error(`Conflict Columns and Update Columns must also be in Values; missing: ${missing.join(', ')}.`);
    }
    const nonKey = columns.filter((column) => !conflict.includes(column));
    const toUpdate = requested.length > 0 ? requested : nonKey.length > 0 ? nonKey : conflict.slice(0, 1);
    const sql = `INSERT INTO ${postgresAi.quoteName({ name: table })} (${columns.map((column) => format.ident(column)).join(', ')}) VALUES (${columns.map((_, index) => `$${index + 1}`).join(', ')}) ON CONFLICT (${conflict.map((column) => format.ident(column)).join(', ')}) DO UPDATE SET ${toUpdate.map((column) => `${format.ident(column)} = EXCLUDED.${format.ident(column)}`).join(', ')} RETURNING *, (xmax = 0)`;
    const result = await postgresAi.withClient({
      auth: context.auth,
      fn: (client) => client.query<unknown[]>({ text: sql, values: columns.map((column) => values[column]), rowMode: 'array' }),
    });
    const stored = result.rows[0] ?? [];
    const rowFields = result.fields.slice(0, -1);
    const row = Object.fromEntries(rowFields.map((field, index) => [field.name, stored[index]]));
    return { row, inserted: stored[rowFields.length] === true };
  },
});
