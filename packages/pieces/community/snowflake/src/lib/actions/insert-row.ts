import { createAction } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../auth';
import { snowflakeCommonProps, toAuthValue, withSnowflake } from '../common';
import { buildInsert } from '../common/operations';
import { legacyInsertOutputSchema } from '../common/output-schemas';

export const insertRowAction = createAction({
  name: 'insert-row',
  classification: 'WRITE',
  displayName: 'Insert Row',
  description: 'Insert a row into a table.',
  audience: 'human',
  aiMetadata: {
    description:
      'Inserts one row into a table picked from dropdowns, with one input per column. Human-only; agents use Insert Row (JSON). Each call appends a new row, so retries duplicate it.',
    idempotent: false,
  },
  outputSchema: legacyInsertOutputSchema,
  auth: snowflakeAuth,
  props: {
    database: snowflakeCommonProps.database,
    schema: snowflakeCommonProps.schema,
    table: snowflakeCommonProps.table,
    table_column_values: snowflakeCommonProps.table_column_values,
  },
  async run(context) {
    const { table, table_column_values } = context.propsValue;
    const { sql, binds } = buildInsert({
      table,
      rows: [Object.fromEntries(Object.entries(table_column_values))],
    });
    const result = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) => session.query({ sql, binds }),
    });
    return result.rows;
  },
});
