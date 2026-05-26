import { createAction } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../auth';
import {
  configureConnection,
  connect,
  destroy,
  execute,
  snowflakeCommonProps,
  SnowflakeAuthValue,
} from '../common';

export const getTableSchemaAction = createAction({
  name: 'get_table_schema',
  displayName: 'Get Table Schema',
  description:
    'Retrieve the column definitions (name, data type, nullability, default) for a Snowflake table.',
  auth: snowflakeAuth,
  props: {
    database: snowflakeCommonProps.database,
    schema: snowflakeCommonProps.schema,
    table: snowflakeCommonProps.table,
  },
  async run(context) {
    const { table } = context.propsValue;

    const connection = configureConnection(context.auth as SnowflakeAuthValue);
    await connect(connection);
    try {
      const result = await execute(connection, `DESCRIBE TABLE ${table}`, []);
      if (!result) return { columns: [] };

      const columns = (result as Record<string, unknown>[]).map((col) => ({
        column_name: col['name'] ?? null,
        data_type: col['type'] ?? null,
        nullable: col['null?'] ?? null,
        default_value: col['default'] ?? null,
        primary_key: col['primary key'] ?? null,
        unique_key: col['unique key'] ?? null,
        check: col['check'] ?? null,
        expression: col['expression'] ?? null,
        comment: col['comment'] ?? null,
      }));

      return { table, columns };
    } finally {
      await destroy(connection);
    }
  },
});
