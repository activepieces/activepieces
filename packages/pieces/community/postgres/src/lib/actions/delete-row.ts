import { createAction, Property } from '@activepieces/pieces-framework';
import { postgresAuth } from '../..';
import { pgClient, postgresCommon, postgresUtils } from '../common';
import { deleteRowOutputSchema } from '../output-schemas';

export const deleteRow = createAction({
  auth: postgresAuth,
  name: 'delete-row',
  displayName: 'Delete Row',
  description: 'Deletes one or more rows from a table',
  audience: 'both',
  outputSchema: deleteRowOutputSchema,
  aiMetadata: {
    description: 'Deletes every row in a PostgreSQL table whose search column equals a given value, and returns how many rows were removed. Use to remove records matched by a single column. Enable Return Deleted Rows to also get the deleted rows back, but leave it off when the delete can match many rows. Idempotent: once the matching rows are gone, re-running with the same input deletes nothing further.',
    idempotent: true,
  },
  props: {
    table: postgresCommon.table,
    search_column: postgresCommon.column({
      displayName: 'Search Column',
      description: 'The column to match rows on.',
    }),
    search_value: Property.ShortText({
      displayName: 'Search Value',
      description: 'Rows whose search column equals this value are deleted.',
      required: true,
    }),
    return_rows: Property.Checkbox({
      displayName: 'Return Deleted Rows',
      description: 'Return every deleted row in the output. Leave off when the delete can match a large number of rows — the row count is always returned.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { table, search_column, search_value, return_rows } = context.propsValue;
    const query = `DELETE FROM ${postgresUtils.qualifiedName(table)} WHERE ${postgresUtils.quoteIdentifier(search_column)} = $1${return_rows ? ' RETURNING *' : ''}`;

    const client = await pgClient(context.auth);
    try {
      const result = await client.query(query, [search_value]);
      return {
        rows: result.rows,
        rowCount: result.rowCount,
      };
    } finally {
      await client.end();
    }
  },
});
