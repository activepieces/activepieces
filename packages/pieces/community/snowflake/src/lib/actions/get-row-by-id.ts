import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../auth';
import {
  getTableColumnOptions,
  snowflakeCommonProps,
  toAuthValue,
  withSnowflake,
} from '../common';
import { getRowByIdOutputSchema } from '../common/output-schemas';
import { identifier, qualifiedName } from '../common/sql';

export const getRowByIdAction = createAction({
  name: 'get_row_by_id',
  classification: 'READ',
  displayName: 'Get Row by ID',
  description:
    'Retrieve a single row from a Snowflake table by matching a column value.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the first row of a table whose chosen column equals a value; the row columns are spread next to found=true, or only found=false when nothing matches. For free-text table names use Get Row by Key. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: getRowByIdOutputSchema,
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
        return getTableColumnOptions({
          auth: toAuthValue(auth),
          table: String(table),
        });
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
    const sql = `SELECT * FROM ${qualifiedName({
      value: table,
      label: 'Table',
    })} WHERE ${identifier({
      name: id_column,
      label: 'ID column',
    })} = ? LIMIT 1`;
    const result = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) => session.query({ sql, binds: [id_value], maxRows: 1 }),
    });
    const row = result.rows[0];
    if (!row) {
      return { found: false };
    }
    return { found: true, ...row };
  },
});
