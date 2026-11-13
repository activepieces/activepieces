import { createAction, Property } from '@activepieces/pieces-framework';
import { mysqlAuth } from '../../../..';
import { mysqlAi, mysqlAiProps } from '../../../common/ai';
import { mysqlRunSelectQueryOutputSchema } from '../../../output-schemas';

export const runSelectQuery = createAction({
  auth: mysqlAuth,
  name: 'mysql_run_select_query',
  outputSchema: mysqlRunSelectQueryOutputSchema,
  displayName: 'Run Select Query',
  description: 'Runs a read-only SQL query and returns up to a limit of rows.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Runs one read-only statement (SELECT, WITH, SHOW, DESCRIBE, EXPLAIN, TABLE, VALUES) inside a read-only transaction and returns up to Limit rows, with hasMore when the query produced more; add your own LIMIT for large tables. Pass dynamic values as ? placeholders in Arguments. Use for joins and aggregates that Find Rows cannot express; use Run Query to change data. Read-only.',
    idempotent: true,
  },
  props: {
    query: Property.LongText({
      displayName: 'Query',
      description: 'One read-only SQL statement. Write ? where each value goes, e.g. SELECT * FROM orders WHERE status = ?',
      required: true,
    }),
    args: Property.Array({
      displayName: 'Arguments',
      description: 'Values for each ? in the query, in order.',
      required: false,
    }),
    limit: mysqlAiProps.limit,
  },
  async run(context) {
    const { query, args, limit } = context.propsValue;
    mysqlAi.assertReadOnlyQuery({ query });
    const max = mysqlAi.boundedInteger({ value: limit, defaultValue: mysqlAi.READ_DEFAULT_LIMIT, min: 1, max: mysqlAi.READ_MAX_LIMIT, label: 'Limit' });
    const { rows, hasMore } = await mysqlAi.withConnection({
      auth: context.auth,
      fn: (conn) =>
        mysqlAi.inTransaction({
          conn,
          readOnly: true,
          fn: () => mysqlAi.queryCapped({ conn, sql: query, values: args ?? [], max }),
        }),
    });
    return { rows, count: rows.length, hasMore };
  },
});
