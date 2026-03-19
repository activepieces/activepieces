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

export const insertMultipleRowsAction = createAction({
  name: 'insert_multiple_rows',
  displayName: 'Insert Multiple Rows',
  description:
    'Insert multiple rows into a Snowflake table in a single operation.',
  auth: snowflakeAuth,
  props: {
    database: snowflakeCommonProps.database,
    schema: snowflakeCommonProps.schema,
    table: snowflakeCommonProps.table,
    rows: Property.Array({
      displayName: 'Rows',
      description:
        'One item per row. Each item must be a JSON object with column names as keys. ' +
        'Example: `{"name": "Alice", "age": 30}`. ' +
        'When mapping from a previous step, pass the entire array directly.',
      required: true,
    }),
  },
  async run(context) {
    const { table, rows } = context.propsValue;

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error('Rows must be a non-empty array.');
    }

    const parsedRows = (rows as unknown[]).map((item) => {
      if (typeof item === 'string') {
        try {
          return JSON.parse(item) as Record<string, unknown>;
        } catch {
          throw new Error(`Invalid JSON in row: ${item}`);
        }
      }
      return item as Record<string, unknown>;
    });

    const columns = Object.keys(parsedRows[0]);
    if (columns.length === 0) {
      throw new Error(
        'Each row object must have at least one key (column name).'
      );
    }

    const rowPlaceholders = parsedRows
      .map(() => `(${columns.map(() => '?').join(', ')})`)
      .join(', ');

    const binds = parsedRows.flatMap((row) =>
      columns.map((col) => row[col])
    ) as string[];

    const sql = `INSERT INTO ${table} (${columns.join(
      ', '
    )}) VALUES ${rowPlaceholders}`;

    const connection = configureConnection(context.auth as SnowflakeAuthValue);
    await connect(connection);
    try {
      const result = await execute(connection, sql, binds);
      return {
        success: true,
        rows_inserted:
          result?.[0]?.['number of rows inserted'] ?? parsedRows.length,
      };
    } finally {
      await destroy(connection);
    }
  },
});
