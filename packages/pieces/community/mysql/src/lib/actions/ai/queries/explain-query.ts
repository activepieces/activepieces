import { createAction, Property } from '@activepieces/pieces-framework';
import { mysqlAuth } from '../../../..';
import { mysqlAi } from '../../../common/ai';
import { mysqlExplainQueryOutputSchema } from '../../../output-schemas';

export const explainQuery = createAction({
  auth: mysqlAuth,
  name: 'mysql_explain_query',
  outputSchema: mysqlExplainQueryOutputSchema,
  displayName: 'Explain Query',
  description: 'Shows how MySQL would execute a query, without running it.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the execution plan of a SELECT, INSERT, UPDATE, DELETE or REPLACE statement as JSON (EXPLAIN FORMAT=JSON) without running it: tables read, access type, indexes used and estimated rows. Use to check a slow or risky query before Run Query or Run Select Query. Pass the statement without EXPLAIN. Read-only.',
    idempotent: true,
  },
  props: {
    query: Property.LongText({
      displayName: 'Query',
      description: 'The statement to explain, without the EXPLAIN keyword. Write ? where each value goes.',
      required: true,
    }),
    args: Property.Array({
      displayName: 'Arguments',
      description: 'Values for each ? in the query, in order.',
      required: false,
    }),
  },
  async run(context) {
    const { query, args } = context.propsValue;
    if (/^\s*(EXPLAIN|DESCRIBE|DESC|ANALYZE)\b/i.test(query)) {
      throw new Error('Pass the statement without EXPLAIN, DESCRIBE or ANALYZE; this action adds EXPLAIN FORMAT=JSON itself.');
    }
    const rows: Record<string, unknown>[] = await mysqlAi.withConnection({
      auth: context.auth,
      fn: (conn) => conn.query(`EXPLAIN FORMAT=JSON ${query}`, args ?? []),
    });
    const plan = rows[0]?.['EXPLAIN'];
    return { plan: typeof plan === 'string' ? JSON.parse(plan) : plan };
  },
});
