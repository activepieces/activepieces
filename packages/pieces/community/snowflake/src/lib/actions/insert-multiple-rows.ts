import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../auth';
import { snowflakeCommonProps, toAuthValue, withSnowflake } from '../common';
import { buildInsert, dmlCount } from '../common/operations';
import { legacyInsertManyOutputSchema } from '../common/output-schemas';
import { parseRowArray } from '../common/sql';

export const insertMultipleRowsAction = createAction({
  name: 'insert_multiple_rows',
  classification: 'WRITE',
  displayName: 'Insert Multiple Rows',
  description:
    'Insert multiple rows into a Snowflake table in a single operation.',
  audience: 'human',
  aiMetadata: {
    description:
      'Bulk-inserts an array of same-keyed row objects into a table picked from dropdowns, in one INSERT. Human-only; agents use Insert Rows (JSON). Each call appends the rows again.',
    idempotent: false,
  },
  outputSchema: legacyInsertManyOutputSchema,
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
        'When mapping from a previous step, pass the entire array directly. Object or array values are stored as JSON (VARIANT).',
      required: true,
    }),
  },
  async run(context) {
    const { table, rows } = context.propsValue;
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error('Rows must be a non-empty array.');
    }
    const parsedRows = parseRowArray({ value: rows, label: 'Row' });
    const { sql, binds } = buildInsert({
      table,
      rows: parsedRows,
      exactColumnNames: true,
    });
    const result = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) => session.query({ sql, binds }),
    });
    return {
      success: true,
      rows_inserted:
        result.rows.length > 0
          ? dmlCount({ result, key: 'number of rows inserted' })
          : parsedRows.length,
    };
  },
});
