import { createAction, Property } from '@activepieces/pieces-framework';
import sql from 'mssql';
import { mssqlAuth } from '../../../auth';
import { mssqlAi, mssqlAiProps } from '../../../common/ai';
import { microsoftSqlServerRunSelectQueryOutputSchema } from '../../../output-schemas';

export const runSelectQuery = createAction({
  auth: mssqlAuth,
  name: 'microsoft_sql_server_run_select_query',
  outputSchema: microsoftSqlServerRunSelectQueryOutputSchema,
  displayName: 'Run Select Query',
  description: 'Runs a read-only SELECT query and returns up to a limit of rows.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Runs one SELECT query (optionally starting with WITH) inside a transaction that is always rolled back, and returns up to Limit rows of its first result set, with has_more when it produced more. Statements that write, execute procedures or change settings are rejected. Pass dynamic values as @name placeholders in Parameters. Use for joins and aggregates Find Rows cannot express; use Run Query to change data. Read-only.',
    idempotent: true,
  },
  props: {
    query: Property.LongText({
      displayName: 'Query',
      description: 'One SELECT query. Write @name where each value goes, e.g. SELECT * FROM dbo.orders WHERE status = @status',
      required: true,
    }),
    parameters: Property.Object({
      displayName: 'Parameters',
      description: 'Values for the @placeholders in the query, keyed by name without the @, e.g. {"status": "open"}.',
      required: false,
    }),
    limit: mssqlAiProps.limit,
  },
  async run(context) {
    const { query, parameters, limit } = context.propsValue;
    mssqlAi.assertReadOnlyQuery({ query });
    const max = mssqlAi.boundedInteger({ value: limit, defaultValue: mssqlAi.READ_DEFAULT_LIMIT, min: 1, max: mssqlAi.READ_MAX_LIMIT, label: 'Limit' });
    const params = Object.fromEntries(Object.entries(parameters ?? {}).map(([name, value]) => [name.replace(/^@/, ''), value]));
    const found = await mssqlAi.withPool({
      auth: context.auth,
      fn: async (pool) => {
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
          const result = await mssqlAi
            .bind({ request: transaction.request(), params })
            .query<Record<string, unknown>>(`SET ROWCOUNT ${max + 1};\n${query}`);
          return result.recordsets.length > 0 ? [...result.recordsets[0]] : [];
        } finally {
          await transaction.rollback().catch(() => undefined);
        }
      },
    });
    const hasMore = found.length > max;
    const rows = found.slice(0, max);
    return { rows, count: rows.length, has_more: hasMore };
  },
});
