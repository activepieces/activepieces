import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../auth';
import {
  configureConnection,
  connect,
  destroy,
  execute,
  snowflakeCommonProps,
} from '../common';

export const searchRowsAction = createAction({
  name: 'search_rows',
  displayName: 'Search Rows',
  description: 'Search for rows in a Snowflake table using an optional WHERE condition, ordering, and row limit.',
  auth: snowflakeAuth,
  props: {
    database: snowflakeCommonProps.database,
    schema: snowflakeCommonProps.schema,
    table: snowflakeCommonProps.table,
    where_clause: Property.ShortText({
      displayName: 'WHERE Condition',
      description:
        'Optional SQL condition to filter results (e.g. `status = \'active\' AND age > 18`). ' +
        'Leave empty to return all rows (subject to the row limit).',
      required: false,
    }),
    order_by: Property.ShortText({
      displayName: 'ORDER BY',
      description:
        'Optional column(s) to sort by (e.g. `created_at DESC` or `name ASC, age DESC`).',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Row Limit',
      description: 'Maximum number of rows to return. Defaults to 100.',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const { table, where_clause, order_by, limit } = context.propsValue;

    let sql = `SELECT * FROM ${table}`;
    if (where_clause) sql += ` WHERE ${where_clause}`;
    if (order_by) sql += ` ORDER BY ${order_by}`;
    sql += ` LIMIT ${limit ?? 100}`;

    const connection = configureConnection(context.auth.props);
    await connect(connection);
    try {
      const result = await execute(connection, sql, []);
      return result ?? [];
    } finally {
      await destroy(connection);
    }
  },
});
