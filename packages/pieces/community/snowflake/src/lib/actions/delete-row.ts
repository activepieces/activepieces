import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../auth';
import {
  configureConnection,
  connect,
  destroy,
  execute,
  snowflakeCommonProps,
  SnowflakeAuthValue,
} from '../common';

export const deleteRowAction = createAction({
  name: 'delete_row',
  displayName: 'Delete Row',
  description:
    'Delete one or more rows from a Snowflake table that match a WHERE condition.',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs a DELETE on a Snowflake table, removing every row matching the required WHERE condition. Use to remove records; the condition is mandatory to guard against wiping the whole table, and it is embedded directly into SQL so pass only trusted values. Re-running after the matching rows are gone deletes nothing further, but treat this as a destructive mutating operation.',
    idempotent: false,
  },
  auth: snowflakeAuth,
  props: {
    database: snowflakeCommonProps.database,
    schema: snowflakeCommonProps.schema,
    table: snowflakeCommonProps.table,
    where_clause: Property.ShortText({
      displayName: 'WHERE Condition',
      description:
        "A SQL condition to filter which rows to delete (e.g. `id = 42` or `status = 'archived'`). " +
        'This field is required to prevent accidental deletion of all rows. ' +
        '**Security note:** this value is embedded directly in SQL. Only use static values or data from trusted, internal steps — never pass unvalidated end-user input here.',
      required: true,
    }),
  },
  async run(context) {
    const { table, where_clause } = context.propsValue;

    const sql = `DELETE FROM ${table} WHERE ${where_clause}`;

    const connection = configureConnection(context.auth as SnowflakeAuthValue);
    await connect(connection);
    try {
      const result = await execute(connection, sql, []);
      return {
        success: true,
        rows_deleted: result?.[0]?.['number of rows deleted'] ?? null,
      };
    } finally {
      await destroy(connection);
    }
  },
});
