import { createAction, Property } from '@activepieces/pieces-framework';
import { postgresAuth } from '../..';
import { pgClient, postgresCommon, postgresUtils } from '../common';
import { updateRowOutputSchema } from '../output-schemas';

export const updateRow = createAction({
  auth: postgresAuth,
  name: 'update-row',
  displayName: 'Update Row',
  description: 'Updates one or more rows in a table',
  audience: 'both',
  outputSchema: updateRowOutputSchema,
  aiMetadata: {
    description: 'Updates every row in a PostgreSQL table whose search column equals a given value, setting the supplied column-to-value pairs, and returns how many rows changed. Use to modify existing records matched by a single column. Enable Return Updated Rows to also get the rows themselves back, but leave it off when the update can match many rows. Idempotent: re-running with the same input writes the same values and has no additional effect.',
    idempotent: true,
  },
  props: {
    table: postgresCommon.table,
    values: Property.Object({
      displayName: 'Values',
      description: 'Column names mapped to their new values.',
      required: true,
    }),
    search_column: postgresCommon.column({
      displayName: 'Search Column',
      description: 'The column to match rows on.',
    }),
    search_value: Property.ShortText({
      displayName: 'Search Value',
      description: 'Rows whose search column equals this value are updated.',
      required: true,
    }),
    return_rows: Property.Checkbox({
      displayName: 'Return Updated Rows',
      description: 'Return every updated row in the output. Leave off when the update can match a large number of rows — the row count is always returned.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { table, values, search_column, search_value, return_rows } = context.propsValue;
    const columns = Object.keys(values);
    if (columns.length === 0) {
      throw new Error('Values must contain at least one column.');
    }

    const assignments = columns
      .map((column, index) => `${postgresUtils.quoteIdentifier(column)} = $${index + 1}`)
      .join(', ');
    const query = `UPDATE ${postgresUtils.qualifiedName(table)} SET ${assignments} WHERE ${postgresUtils.quoteIdentifier(search_column)} = $${columns.length + 1}${return_rows ? ' RETURNING *' : ''}`;

    const client = await pgClient(context.auth);
    try {
      const result = await client.query(query, [
        ...columns.map((column) => values[column]),
        search_value,
      ]);
      return {
        rows: result.rows,
        rowCount: result.rowCount,
      };
    } finally {
      await client.end();
    }
  },
});
