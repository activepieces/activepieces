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

export const searchRowsAction = createAction({
  name: 'search_rows',
  displayName: 'Search Rows',
  description:
    'Search for rows in a Snowflake table using an optional WHERE condition, ordering, and row limit.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns rows from a Snowflake table with an optional WHERE filter, ORDER BY sort, and row limit (default 100); leaving the filter empty returns all rows up to the limit. Use to retrieve a filtered or sorted set of records; for a single row by key use Get Row by ID. The filter and sort clauses are embedded directly into SQL, so pass only trusted values. Read-only and idempotent.',
    idempotent: true,
  },
  auth: snowflakeAuth,
  props: {
    database: snowflakeCommonProps.database,
    schema: snowflakeCommonProps.schema,
    table: snowflakeCommonProps.table,
    where_clause: Property.ShortText({
      displayName: 'Filter Condition',
      description:
        "Optional SQL WHERE condition to narrow down results (e.g. `status = 'active' AND age > 18`). " +
        'Leave empty to return all rows (subject to the row limit). ' +
        '**Security note:** this value is embedded directly in SQL. Only use static values or data from trusted, internal steps — never pass unvalidated end-user input here.',
      required: false,
    }),
    order_by: Property.ShortText({
      displayName: 'Sort By',
      description:
        'Optional column(s) to sort results by (SQL ORDER BY clause). Examples: `created_at DESC` sorts newest first; `name ASC, age DESC` sorts by name then age. ' +
        '**Security note:** this value is embedded directly in SQL. Only use static values or data from trusted, internal steps — never pass unvalidated end-user input here.',
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
    sql += ` LIMIT ${Math.trunc(limit ?? 100)}`;

    const connection = configureConnection(context.auth as SnowflakeAuthValue);
    await connect(connection);
    try {
      const result = await execute(connection, sql, []);
      return result ?? [];
    } finally {
      await destroy(connection);
    }
  },
});
