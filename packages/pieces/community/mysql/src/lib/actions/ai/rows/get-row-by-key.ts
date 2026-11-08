import { createAction, Property } from '@activepieces/pieces-framework';
import { mysqlAuth } from '../../../..';
import { mysqlAi, mysqlAiProps } from '../../../common/ai';
import { sanitizeColumnName } from '../../../common';
import { mysqlGetRowByKeyOutputSchema } from '../../../output-schemas';

export const getRowByKey = createAction({
  auth: mysqlAuth,
  name: 'mysql_get_row_by_key',
  outputSchema: mysqlGetRowByKeyOutputSchema,
  displayName: 'Get Row by Key',
  description: 'Gets the one row whose key column equals a value.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the single row whose key column equals the given value, usually the primary key (see List Indexes or Describe Table). Fails if no row matches, or if more than one does because the column is not unique; use Find Rows for those cases. Read-only.',
    idempotent: true,
  },
  props: {
    table: mysqlAiProps.table,
    keyColumn: Property.ShortText({
      displayName: 'Key Column',
      description: 'A primary-key or unique column, e.g. id.',
      required: true,
    }),
    keyValue: Property.ShortText({
      displayName: 'Key Value',
      description: 'The value of the key column, e.g. the insertId returned by Insert Row.',
      required: true,
    }),
  },
  async run(context) {
    const { table, keyColumn, keyValue } = context.propsValue;
    const rows: unknown[] = await mysqlAi.withConnection({
      auth: context.auth,
      fn: (conn) => conn.query(`SELECT * FROM ${sanitizeColumnName(table)} WHERE ${sanitizeColumnName(keyColumn)} = ? LIMIT 2`, [keyValue]),
    });
    if (rows.length === 0) {
      throw new Error(`No row in "${table}" where ${keyColumn} = ${keyValue}.`);
    }
    if (rows.length > 1) {
      throw new Error(`More than one row in "${table}" has ${keyColumn} = ${keyValue}; that column is not unique. Use Find Rows instead.`);
    }
    return { row: rows[0] };
  },
});
