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

export const upsertRowAction = createAction({
  name: 'upsert_row',
  displayName: 'Upsert Row',
  description:
    'Insert a new row or update an existing one if a row with the same match column value already exists (MERGE INTO).',
  auth: snowflakeAuth,
  props: {
    database: snowflakeCommonProps.database,
    schema: snowflakeCommonProps.schema,
    table: snowflakeCommonProps.table,
    match_column: Property.Dropdown({
      auth: snowflakeAuth,
      displayName: 'Match Column',
      description:
        'The column used to identify whether a row already exists (e.g. the primary key or a unique identifier column).',
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
    table_column_values: snowflakeCommonProps.table_column_values,
  },
  async run(context) {
    const {
      table,
      match_column,
      table_column_values: columnValues,
    } = context.propsValue;

    const columns = Object.keys(columnValues);
    if (columns.length === 0) {
      throw new Error('At least one column value must be provided.');
    }

    if (!columns.includes(match_column)) {
      throw new Error(
        `Match column "${match_column}" must be included in the column values. ` +
          `Please add a value for "${match_column}" in the columns to upsert.`
      );
    }

    // Build MERGE INTO statement
    // source: SELECT ? AS col1, ? AS col2, ...
    const sourceSelects = columns.map((col) => `? AS ${col}`).join(', ');
    const updateEntries = columns.filter((col) => col !== match_column);
    if (updateEntries.length === 0) {
      throw new Error(
        'At least one column other than the match column must be provided to update.'
      );
    }
    const updateSets = updateEntries
      .map((col) => `target.${col} = source.${col}`)
      .join(', ');
    const insertCols = columns.join(', ');
    const insertVals = columns.map((col) => `source.${col}`).join(', ');

    const sql = `
MERGE INTO ${table} AS target
USING (SELECT ${sourceSelects}) AS source
ON target.${match_column} = source.${match_column}
WHEN MATCHED THEN
  UPDATE SET ${updateSets}
WHEN NOT MATCHED THEN
  INSERT (${insertCols}) VALUES (${insertVals})
    `.trim();

    const binds = Object.values(columnValues) as string[];

    const connection = configureConnection(context.auth as SnowflakeAuthValue);
    await connect(connection);
    try {
      const result = await execute(connection, sql, binds);
      return {
        success: true,
        rows_inserted: result?.[0]?.['number of rows inserted'] ?? null,
        rows_updated: result?.[0]?.['number of rows updated'] ?? null,
      };
    } finally {
      await destroy(connection);
    }
  },
});
