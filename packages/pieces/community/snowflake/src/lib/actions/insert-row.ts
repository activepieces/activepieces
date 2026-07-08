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

export const insertRowAction = createAction({
  name: 'insert-row',
  displayName: 'Insert Row',
  description: 'Insert a row into a table.',
  audience: 'both',
  aiMetadata: {
    description:
      'Inserts a single new row into a specified Snowflake table (database, schema, table, and a map of column values). Use when adding one record; for many rows at once use Insert Multiple Rows. Not idempotent: each call issues an INSERT, so repeating it appends a duplicate row unless the table enforces uniqueness.',
    idempotent: false,
  },
  auth: snowflakeAuth,
  props: {
    database: snowflakeCommonProps.database,
    schema: snowflakeCommonProps.schema,
    table: snowflakeCommonProps.table,
    table_column_values: snowflakeCommonProps.table_column_values,
  },
  async run(context) {
    const tableName = context.propsValue.table;
    const tableColumnValues = context.propsValue.table_column_values;

    const columns = Object.keys(tableColumnValues).join(',');
    const valuePlaceholders = Object.keys(tableColumnValues)
      .map(() => '?')
      .join(', ');
    const statement = `INSERT INTO ${tableName}(${columns}) VALUES(${valuePlaceholders})`;

    const connection = configureConnection(context.auth as SnowflakeAuthValue);
    await connect(connection);

    const response = await execute(
      connection,
      statement,
      Object.values(tableColumnValues)
    );
    await destroy(connection);

    return response;
  },
});
