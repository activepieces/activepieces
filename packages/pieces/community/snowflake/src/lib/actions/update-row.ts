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

export const updateRowAction = createAction({
  name: 'update_row',
  displayName: 'Update Row',
  description:
    'Update one or more rows in a Snowflake table that match a WHERE condition.',
  auth: snowflakeAuth,
  props: {
    database: snowflakeCommonProps.database,
    schema: snowflakeCommonProps.schema,
    table: snowflakeCommonProps.table,
    table_update_values: snowflakeCommonProps.table_update_values,
    where_clause: Property.ShortText({
      displayName: 'WHERE Condition',
      description:
        "A SQL condition to filter which rows to update (e.g. `id = 42` or `status = 'active'`). " +
        'Leave empty to update ALL rows in the table (use with caution). ' +
        '**Security note:** this value is embedded directly in SQL. Only use static values or data from trusted, internal steps — never pass unvalidated end-user input here.',
      required: false,
    }),
  },
  async run(context) {
    const {
      table,
      table_update_values: columnValues,
      where_clause,
    } = context.propsValue;

    const setEntries = Object.entries(columnValues).filter(
      ([, v]) => v !== null && v !== undefined && v !== ''
    );

    if (setEntries.length === 0) {
      throw new Error('At least one column value must be provided to update.');
    }

    const setClauses = setEntries.map(([col]) => `${col} = ?`).join(', ');
    const binds = setEntries.map(([, v]) => v) as string[];

    const sql = where_clause
      ? `UPDATE ${table} SET ${setClauses} WHERE ${where_clause}`
      : `UPDATE ${table} SET ${setClauses}`;

    const connection = configureConnection(context.auth as SnowflakeAuthValue);
    await connect(connection);
    try {
      const result = await execute(connection, sql, binds);
      return {
        success: true,
        rows_updated: result?.[0]?.['number of rows updated'] ?? null,
      };
    } finally {
      await destroy(connection);
    }
  },
});
