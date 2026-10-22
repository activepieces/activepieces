import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../../auth';
import { toAuthValue, withSnowflake } from '../../common';
import { aiProps } from '../../common/ai-props';
import { getRowOutputSchema } from '../../common/output-schemas';
import { identifier, qualifiedName } from '../../common/sql';

export const getRowByKeyAction = createAction({
  name: 'get_row_by_key',
  classification: 'READ',
  displayName: 'Get Row by Key',
  description: 'Get one row of a table where a key column equals a value.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the row whose key column equals the given value as {found, row}; found is false and row null when nothing matches. Fails if more than one row matches, since the column is then not a unique key; use Find Rows for that. Safe to retry.',
    idempotent: true,
  },
  outputSchema: getRowOutputSchema,
  auth: snowflakeAuth,
  props: {
    table: aiProps.table(),
    keyColumn: Property.ShortText({
      displayName: 'Key Column',
      description: 'The unique key column, e.g. `ID`.',
      required: true,
    }),
    keyValue: Property.ShortText({
      displayName: 'Key Value',
      description: 'The key value to look up.',
      required: true,
    }),
  },
  async run(context) {
    const { table, keyColumn, keyValue } = context.propsValue;
    const sql = `SELECT * FROM ${qualifiedName({
      value: table,
      label: 'Table',
    })} WHERE ${identifier({
      name: keyColumn,
      label: 'Key column',
    })} = ? LIMIT 2`;
    const result = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) => session.query({ sql, binds: [keyValue], maxRows: 2 }),
    });
    if (result.rows.length > 1) {
      throw new Error(
        `More than one row has ${keyColumn} = ${keyValue}; ${keyColumn} is not a unique key. Use Find Rows instead.`
      );
    }
    const row = result.rows[0];
    return { found: row !== undefined, row: row ?? null };
  },
});
