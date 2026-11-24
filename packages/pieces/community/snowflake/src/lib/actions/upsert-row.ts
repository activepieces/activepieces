import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../auth';
import {
  getTableColumnOptions,
  snowflakeCommonProps,
  toAuthValue,
  withSnowflake,
} from '../common';
import { buildMerge } from '../common/merge';
import { dmlCount } from '../common/operations';
import { legacyUpsertOutputSchema } from '../common/output-schemas';

export const upsertRowAction = createAction({
  name: 'upsert_row',
  classification: 'WRITE',
  displayName: 'Upsert Row',
  description:
    'Insert a new row or update an existing one if a row with the same match column value already exists (MERGE INTO).',
  audience: 'human',
  aiMetadata: {
    description:
      'MERGE-based create-or-update on a table and match column picked from dropdowns. Human-only; agents use Upsert Row by Key. Repeating the call with the same values converges to the same row.',
    idempotent: true,
  },
  outputSchema: legacyUpsertOutputSchema,
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
        return getTableColumnOptions({
          auth: toAuthValue(auth),
          table: String(table),
        });
      },
    }),
    table_column_values: snowflakeCommonProps.table_column_values,
  },
  async run(context) {
    const { table, match_column, table_column_values } = context.propsValue;
    const values = Object.fromEntries(Object.entries(table_column_values));
    if (Object.keys(values).length === 0) {
      throw new Error('At least one column value must be provided.');
    }
    if (!(match_column in values)) {
      throw new Error(
        `Match column "${match_column}" must be included in the column values. ` +
          `Please add a value for "${match_column}" in the columns to upsert.`
      );
    }
    const { sql, binds } = buildMerge({
      table,
      keyColumns: [match_column],
      values,
    });
    const result = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) => session.query({ sql, binds }),
    });
    return {
      success: true,
      rows_inserted: dmlCount({ result, key: 'number of rows inserted' }),
      rows_updated: dmlCount({ result, key: 'number of rows updated' }),
    };
  },
});
