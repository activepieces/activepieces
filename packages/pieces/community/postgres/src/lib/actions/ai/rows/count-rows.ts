import { createAction } from '@activepieces/pieces-framework';
import { postgresAuth } from '../../../auth';
import { postgresAi, postgresAiProps } from '../../../ai-common';
import { postgresCountRowsOutputSchema } from '../../../output-schemas';

export const countRows = createAction({
  auth: postgresAuth,
  name: 'postgres_count_rows',
  outputSchema: postgresCountRowsOutputSchema,
  displayName: 'Count Rows',
  description: 'Counts the rows in a table that match the filters.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the exact number of rows in a table or view matching all given filters, or every row when no filter is given. Use before Update Rows or Delete Rows to check how many rows a filter hits, or to size paging in Find Rows. Read-only.',
    idempotent: true,
  },
  props: {
    table: postgresAiProps.table,
    filters: postgresAiProps.filters({ required: false }),
  },
  async run(context) {
    const { table, filters } = context.propsValue;
    const where = postgresAi.buildWhere({ filters, startAt: 0 });
    const result = await postgresAi.withClient({
      auth: context.auth,
      fn: (client) => client.query<{ count: string }>(`SELECT count(*) AS count FROM ${postgresAi.quoteName({ name: table })}${where.sql}`, where.values),
    });
    return { count: Number(result.rows[0]?.count ?? 0) };
  },
});
