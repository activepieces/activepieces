import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { redshiftAuth } from '../auth';
import { redshiftClient } from '../common/client';
import { runQueryOutputSchema } from '../output-schemas';

export const runQuery = createAction({
  auth: redshiftAuth,
  name: 'run_query',
  classification: 'WRITE',
  displayName: 'Run Query',
  description: 'Runs one SQL statement.',
  audience: 'both',
  outputSchema: runQueryOutputSchema,
  aiMetadata: {
    description: 'Runs a single SQL statement against Amazon Redshift and returns its rows and row count. Use it when no specific action fits: joins, aggregates, ranges, DDL. Always pass dynamic values in Arguments and reference them as $1, $2; never put them in the SQL text. Not idempotent: the statement may change data.',
    idempotent: false,
  },
  props: {
    markdown: Property.MarkDown({
      value: 'Never type dynamic values into the query. Write $1, $2 and put the values in Arguments to prevent SQL injection.',
      variant: MarkdownVariant.WARNING,
    }),
    query: Property.LongText({
      displayName: 'Query',
      description: 'One SQL statement. Write $1, $2 where each value goes.',
      placeholder: 'SELECT * FROM public.orders WHERE status = $1',
      required: true,
    }),
    args: Property.Array({
      displayName: 'Arguments',
      description: 'Values for $1, $2 and so on in the query, in order.',
      required: false,
    }),
  },
  async run(context) {
    const { query, args } = context.propsValue;
    return await redshiftClient.runSql({ auth: context.auth, server: context.server, sql: query, params: args ?? [] });
  },
});
