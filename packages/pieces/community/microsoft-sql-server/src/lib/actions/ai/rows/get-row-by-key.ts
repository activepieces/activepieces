import { createAction, Property } from '@activepieces/pieces-framework';
import { mssqlAuth } from '../../../auth';
import { mssqlCommon } from '../../../common';
import { mssqlAi, mssqlAiProps } from '../../../common/ai';
import { microsoftSqlServerGetRowByKeyOutputSchema } from '../../../output-schemas';

export const getRowByKey = createAction({
  auth: mssqlAuth,
  name: 'microsoft_sql_server_get_row_by_key',
  outputSchema: microsoftSqlServerGetRowByKeyOutputSchema,
  displayName: 'Get Row by Key',
  description: 'Returns the one row whose key columns equal the given values.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the single row whose key columns equal the given values, e.g. {"id": 42}, or found false with row null when none matches. Fails when the values match more than one row, so give every column of the primary or a unique key (see Describe Table or List Indexes). Use Find Rows to search by other columns. Read-only.',
    idempotent: true,
  },
  props: {
    schema: mssqlAiProps.schema,
    table: mssqlAiProps.table,
    key: Property.Object({
      displayName: 'Key',
      description: 'Key column names mapped to their values, e.g. {"id": 42} or {"order_id": 7, "line": 1}.',
      required: true,
    }),
  },
  async run(context) {
    const { schema, table } = context.propsValue;
    const key = mssqlAi.parseValues({ value: context.propsValue.key, label: 'Key' });
    const columns = Object.keys(key);
    return mssqlAi.withPool({
      auth: context.auth,
      fn: async (pool) => {
        const target = await mssqlAi.resolveObject({ pool, schema, name: table, kinds: mssqlAi.TABLE_KINDS, label: 'Table' });
        const meta = await mssqlCommon.getTableMeta({ pool, table: target });
        const where = columns
          .map((column, index) =>
            key[column] === null ? `${mssqlCommon.quoteId(column)} IS NULL` : `${mssqlCommon.quoteId(column)} = @k${index}`,
          )
          .join(' AND ');
        const params = Object.fromEntries(columns.map((column, index) => [`k${index}`, key[column]]));
        const result = await mssqlAi
          .bind({ request: pool.request(), params })
          .query<Record<string, unknown>>(
            `SELECT TOP (2) ${mssqlAi.projection({ columns: meta.columns })} FROM ${mssqlCommon.quoteTable(target)} WHERE ${where}`
          );
        if (result.recordset.length > 1) {
          throw new Error(`More than one row matches ${JSON.stringify(key)}. Give every column of the primary or a unique key; List Indexes shows them.`);
        }
        const row = result.recordset[0] ?? null;
        return { found: row !== null, row };
      },
    });
  },
});
