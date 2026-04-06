import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../auth';
import {
  configureConnection,
  connect,
  destroy,
  execute,
  getTableColumnOptions,
  snowflakeCommonProps,
  SnowflakeAuthValue,
} from '../common';

export const getRowByIdAction = createAction({
  name: 'get_row_by_id',
  displayName: 'Get Row by ID',
  description:
    'Retrieve a single row from a Snowflake table by matching a column value.',
  auth: snowflakeAuth,
  props: {
    database: snowflakeCommonProps.database,
    schema: snowflakeCommonProps.schema,
    table: snowflakeCommonProps.table,
    id_column: Property.Dropdown({
      auth: snowflakeAuth,
      displayName: 'ID Column',
      description:
        'The column to search in (e.g. the primary key or unique identifier column).',
      refreshers: ['table'],
      required: true,
      options: async ({ auth, table }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }
        if (!table) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please select a table first',
          };
        }
        return getTableColumnOptions(
          auth as SnowflakeAuthValue,
          table as string
        );
      },
    }),
    id_value: Property.ShortText({
      displayName: 'ID Value',
      description: 'The value to look up in the ID column.',
      required: true,
    }),
  },
  async run(context) {
    const { table, id_column, id_value } = context.propsValue;

    const sql = `SELECT * FROM ${table} WHERE ${id_column} = ? LIMIT 1`;

    const connection = configureConnection(context.auth as SnowflakeAuthValue);
    await connect(connection);
    try {
      const result = await execute(connection, sql, [id_value]);
      if (!result || result.length === 0) {
        return { found: false };
      }
      const row = result[0] as Record<string, unknown>;
      return { found: true, ...row };
    } finally {
      await destroy(connection);
    }
  },
});
