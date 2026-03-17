import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../auth';
import {
  configureConnection,
  connect,
  destroy,
  execute,
  snowflakeCommonProps,
} from '../common';

export const insertMultipleRowsAction = createAction({
  name: 'insert_multiple_rows',
  displayName: 'Insert Multiple Rows',
  description: 'Insert multiple rows into a Snowflake table in a single operation.',
  auth: snowflakeAuth,
  props: {
    database: snowflakeCommonProps.database,
    schema: snowflakeCommonProps.schema,
    table: snowflakeCommonProps.table,
    rows: Property.Json({
      displayName: 'Rows',
      description:
        'A JSON array of objects to insert. Each object must have the same keys representing column names. ' +
        'Example: `[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]`',
      required: true,
    }),
  },
  async run(context) {
    const { table, rows } = context.propsValue;

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error('Rows must be a non-empty JSON array.');
    }

    const columns = Object.keys(rows[0] as Record<string, unknown>);
    if (columns.length === 0) {
      throw new Error('Each row object must have at least one key (column name).');
    }

    const rowPlaceholders = (rows as Record<string, unknown>[])
      .map(() => `(${columns.map(() => '?').join(', ')})`)
      .join(', ');

    const binds = (rows as Record<string, unknown>[]).flatMap((row) =>
      columns.map((col) => row[col])
    ) as string[];

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${rowPlaceholders}`;

    const connection = configureConnection(context.auth.props);
    await connect(connection);
    try {
      const result = await execute(connection, sql, binds);
      return {
        success: true,
        rows_inserted: result?.[0]?.['number of rows inserted'] ?? rows.length,
      };
    } finally {
      await destroy(connection);
    }
  },
});
