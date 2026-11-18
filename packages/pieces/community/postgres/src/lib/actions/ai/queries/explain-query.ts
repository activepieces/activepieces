import { createAction, Property } from '@activepieces/pieces-framework';
import { postgresAuth } from '../../../auth';
import { postgresAi, postgresAiProps } from '../../../ai-common';
import { postgresExplainQueryOutputSchema } from '../../../output-schemas';

export const explainQuery = createAction({
  auth: postgresAuth,
  name: 'postgres_explain_query',
  outputSchema: postgresExplainQueryOutputSchema,
  displayName: 'Explain Query',
  description: 'Shows the plan Postgres would use for a query, without running it.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the planner\'s estimated execution plan for one statement as JSON (EXPLAIN, never ANALYZE), so the statement itself is not run, even an INSERT, UPDATE or DELETE. Use to check whether a query uses an index or scans a whole table before running it with Run Select Query or Run Query. Read-only.',
    idempotent: true,
  },
  props: {
    query: Property.LongText({
      displayName: 'Query',
      description: 'The statement to explain. Write $1, $2 where each value goes.',
      required: true,
    }),
    args: postgresAiProps.args,
  },
  async run(context) {
    const { query, args } = context.propsValue;
    const result = await postgresAi.withClient({
      auth: context.auth,
      fn: (client) =>
        postgresAi.inTransaction({
          client,
          readOnly: true,
          fn: () => client.query<{ 'QUERY PLAN': unknown[] }>(postgresAi.singleStatement({ text: `EXPLAIN (FORMAT JSON) ${query}`, values: args ?? [] })),
        }),
    });
    return { plan: result.rows[0]?.['QUERY PLAN'][0] ?? null };
  },
});
