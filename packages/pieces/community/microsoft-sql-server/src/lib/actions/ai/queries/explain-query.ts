import { createAction, Property } from '@activepieces/pieces-framework';
import sql from 'mssql';
import { mssqlAuth } from '../../../auth';
import { mssqlAi } from '../../../common/ai';
import { microsoftSqlServerExplainQueryOutputSchema } from '../../../output-schemas';

export const explainQuery = createAction({
  auth: mssqlAuth,
  name: 'microsoft_sql_server_explain_query',
  outputSchema: microsoftSqlServerExplainQueryOutputSchema,
  displayName: 'Explain Query',
  description: 'Returns the estimated execution plan of a query without running it.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the estimated execution plan (showplan XML) of a T-SQL statement without executing it, one plan per statement, to check index use and costs before running a slow query. Write literal values: @placeholders are not supported unless the query DECLAREs them. Needs the SHOWPLAN permission. Read-only.',
    idempotent: true,
  },
  props: {
    query: Property.LongText({
      displayName: 'Query',
      description: 'The T-SQL statement to explain, with literal values, e.g. SELECT * FROM dbo.orders WHERE status = \'open\'',
      required: true,
    }),
  },
  async run(context) {
    const { query } = context.propsValue;
    if (/\bSHOWPLAN/i.test(query) || /^\s*GO\s*$/im.test(query)) {
      throw new Error('The query must not contain SHOWPLAN settings or GO separators.');
    }
    const plans = await mssqlAi.withPool({
      auth: context.auth,
      fn: async (pool) => {
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
          await transaction.request().batch('SET SHOWPLAN_XML ON');
          try {
            const result = await transaction.request().batch<Record<string, unknown>>(query);
            return result.recordsets.flatMap((set) => [...set].map((row) => String(Object.values(row)[0])));
          } finally {
            await transaction.request().batch('SET SHOWPLAN_XML OFF');
          }
        } finally {
          await transaction.rollback().catch(() => undefined);
        }
      },
    });
    return { plans, count: plans.length };
  },
});
