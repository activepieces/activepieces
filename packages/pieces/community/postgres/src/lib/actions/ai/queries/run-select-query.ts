import { createAction, Property } from '@activepieces/pieces-framework';
import { postgresAuth } from '../../../auth';
import { postgresAi, postgresAiProps } from '../../../ai-common';
import { postgresRunSelectQueryOutputSchema } from '../../../output-schemas';

export const runSelectQuery = createAction({
  auth: postgresAuth,
  name: 'postgres_run_select_query',
  outputSchema: postgresRunSelectQueryOutputSchema,
  displayName: 'Run Select Query',
  description: 'Runs one read-only SELECT query and returns its rows.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Runs a single SELECT, WITH or VALUES statement inside a read-only transaction and returns up to Limit rows, with hasMore when there were more. Use for joins, aggregates and anything Find Rows cannot express; the database rejects any write, and only one statement is accepted. Pass values as $1, $2 placeholders with Arguments. Use Run Query to change data.',
    idempotent: true,
  },
  props: {
    query: Property.LongText({
      displayName: 'Query',
      description: 'One SELECT, WITH or VALUES statement. Write $1, $2 where each value goes, e.g. SELECT * FROM orders WHERE status = $1',
      required: true,
    }),
    args: postgresAiProps.args,
    limit: postgresAiProps.limit,
  },
  async run(context) {
    const { query, args, limit } = context.propsValue;
    const max = postgresAi.boundedInteger({ value: limit, defaultValue: postgresAi.READ_DEFAULT_LIMIT, min: 1, max: postgresAi.READ_MAX_LIMIT, label: 'Limit' });
    const fetched = await postgresAi.withClient({
      auth: context.auth,
      fn: (client) =>
        postgresAi.inTransaction({
          client,
          readOnly: true,
          fn: async () => {
            await client.query(postgresAi.singleStatement({ text: `DECLARE ap_select NO SCROLL CURSOR FOR ${query}`, values: args ?? [] }));
            return client.query(`FETCH FORWARD ${max + 1} FROM ap_select`);
          },
        }),
    });
    const hasMore = fetched.rows.length > max;
    const rows = fetched.rows.slice(0, max);
    return { rows, count: rows.length, hasMore };
  },
});
