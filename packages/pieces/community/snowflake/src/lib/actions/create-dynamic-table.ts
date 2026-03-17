import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../auth';
import {
  configureConnection,
  connect,
  destroy,
  execute,
  snowflakeCommonProps,
} from '../common';

export const createDynamicTableAction = createAction({
  name: 'create_dynamic_table',
  displayName: 'Create / Refresh Dynamic Table',
  description:
    'Create or replace a Snowflake Dynamic Table that automatically refreshes based on a query. ' +
    'Dynamic Tables are a declarative way to define a table whose content is derived from a query, updated on a schedule.',
  auth: snowflakeAuth,
  props: {
    database: snowflakeCommonProps.database,
    schema: snowflakeCommonProps.schema,
    table_name: Property.ShortText({
      displayName: 'Dynamic Table Name',
      description:
        'The name for the new dynamic table (e.g. `DAILY_SALES_SUMMARY`).',
      required: true,
    }),
    target_lag: Property.ShortText({
      displayName: 'Target Lag',
      description:
        'How fresh the dynamic table data should be. Accepts time expressions like `1 minute`, `5 minutes`, `1 hour`, or `DOWNSTREAM` to refresh when downstream objects are refreshed.',
      required: true,
      defaultValue: '1 hour',
    }),
    warehouse: Property.ShortText({
      displayName: 'Warehouse',
      description:
        'The name of the virtual warehouse to use when refreshing the dynamic table. Uses the auth warehouse if left empty.',
      required: false,
    }),
    query: Property.LongText({
      displayName: 'Source Query',
      description:
        'The SELECT statement that defines the dynamic table content. ' +
        'Example: `SELECT user_id, SUM(amount) AS total FROM orders GROUP BY user_id`',
      required: true,
    }),
  },
  async run(context) {
    const { database, schema, table_name, target_lag, warehouse, query } =
      context.propsValue;

    const effectiveWarehouse = warehouse || context.auth.props.warehouse;
    if (!effectiveWarehouse) {
      throw new Error(
        'A warehouse is required. Provide it in the action props or set a default in your connection.'
      );
    }

    const sql = `
CREATE OR REPLACE DYNAMIC TABLE ${database}.${schema}.${table_name}
  TARGET_LAG = '${target_lag}'
  WAREHOUSE = ${effectiveWarehouse}
  AS ${query}
    `.trim();

    const connection = configureConnection(context.auth.props);
    await connect(connection);
    try {
      await execute(connection, sql, []);
      return {
        success: true,
        table: `${database}.${schema}.${table_name}`,
        target_lag,
        warehouse: effectiveWarehouse,
      };
    } finally {
      await destroy(connection);
    }
  },
});
