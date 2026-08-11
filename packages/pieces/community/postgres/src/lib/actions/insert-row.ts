import { createAction, Property } from '@activepieces/pieces-framework';
import { postgresAuth } from '../..';
import { pgClient, postgresCommon, postgresUtils } from '../common';
import { insertRowOutputSchema } from '../output-schemas';

export const insertRow = createAction({
  auth: postgresAuth,
  name: 'insert-row',
  displayName: 'Insert Row',
  description: 'Inserts a new row into a table',
  audience: 'both',
  outputSchema: insertRowOutputSchema,
  aiMetadata: {
    description: 'Inserts a single row into a PostgreSQL table from a map of column names to values, and returns the inserted row as stored by the database (including defaults and generated ids). Use to add a record. Not idempotent: each call performs a fresh INSERT, so repeating it adds duplicate rows or errors on a unique-key collision.',
    idempotent: false,
  },
  props: {
    table: postgresCommon.table,
    values: Property.Object({
      displayName: 'Values',
      description: 'Column names mapped to the values to insert.',
      required: true,
    }),
  },
  async run(context) {
    const { table, values } = context.propsValue;
    const columns = Object.keys(values);
    if (columns.length === 0) {
      throw new Error('Values must contain at least one column.');
    }

    const quotedColumns = columns.map((column) => postgresUtils.quoteIdentifier(column)).join(', ');
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
    const query = `INSERT INTO ${postgresUtils.qualifiedName(table)} (${quotedColumns}) VALUES (${placeholders}) RETURNING *`;

    const client = await pgClient(context.auth);
    try {
      const result = await client.query(query, columns.map((column) => values[column]));
      return {
        row: result.rows[0] ?? null,
        rowCount: result.rowCount,
      };
    } finally {
      await client.end();
    }
  },
});
