import { createAction } from '@activepieces/pieces-framework';
import { mssqlAuth } from '../../../auth';
import { mssqlCommon } from '../../../common';
import { mssqlAi, mssqlAiProps } from '../../../common/ai';
import { microsoftSqlServerCountRowsOutputSchema } from '../../../output-schemas';

export const countRows = createAction({
  auth: mssqlAuth,
  name: 'microsoft_sql_server_count_rows',
  outputSchema: microsoftSqlServerCountRowsOutputSchema,
  displayName: 'Count Rows',
  description: 'Counts the rows of a table that match the filters.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Counts the rows of a table or view matching all given filters, or every row when none are given. Use before Update Rows or Delete Rows to check how many rows a filter hits, or to plan paging with Find Rows. Read-only.',
    idempotent: true,
  },
  props: {
    schema: mssqlAiProps.schema,
    table: mssqlAiProps.table,
    filters: mssqlAiProps.filters({ required: false }),
  },
  async run(context) {
    const { schema, table, filters } = context.propsValue;
    const where = mssqlAi.buildWhere({ filters });
    const count = await mssqlAi.withPool({
      auth: context.auth,
      fn: async (pool) => {
        const target = await mssqlAi.resolveObject({ pool, schema, name: table, kinds: mssqlAi.TABLE_KINDS, label: 'Table' });
        const result = await mssqlAi
          .bind({ request: pool.request(), params: where.params })
          .query<Record<string, unknown>>(`SELECT COUNT_BIG(*) AS total FROM ${mssqlCommon.quoteTable(target)}${where.sql}`);
        return Number(result.recordset[0]?.['total'] ?? 0);
      },
    });
    return { count };
  },
});
