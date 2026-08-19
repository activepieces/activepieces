import { createAction, Property } from '@activepieces/pieces-framework';
import { mssqlAuth } from '../auth';
import { mssqlCommon } from '../common';
import { warningMarkdown } from '../common/props';
import { runQueryActionOutputSchema } from '../output-schemas';

export const runQueryAction = createAction({
  auth: mssqlAuth,
  name: 'run_query',
  displayName: 'Run Query',
  description: 'Runs a T-SQL statement and returns the rows it produced',
  audience: 'both',
  aiMetadata: {
    description:
      'Executes an arbitrary T-SQL statement against the connected SQL Server database and returns the resulting rows. Use this when no more specific action fits: joins, aggregates, DDL, stored procedures or multi-table writes. Pass every dynamic value through the Parameters map as a named @placeholder rather than building it into the query text, to avoid SQL injection. Not idempotent in general: the statement may be a mutation, so repeating the call can change data each time.',
    idempotent: false,
  },
  props: {
    markdown: warningMarkdown,
    query: Property.LongText({
      displayName: 'Query',
      description:
        'The T-SQL to run. Refer to values as @name and define them in Parameters below, for example: SELECT * FROM customers WHERE id = @id',
      required: true,
    }),
    parameters: Property.Object({
      displayName: 'Parameters',
      description:
        'Values for the @placeholders in the query. Enter the name without the @ prefix — a key of id fills @id.',
      required: false,
    }),
    query_timeout: Property.Number({
      displayName: 'Query Timeout (ms)',
      description: 'How long to wait for the statement before giving up.',
      required: false,
      defaultValue: 30000,
    }),
  },
  outputSchema: runQueryActionOutputSchema,
  async run(context) {
    const { query, parameters, query_timeout } = context.propsValue;
    const pool = await mssqlCommon.connect({
      auth: context.auth,
      requestTimeoutMs: query_timeout,
    });
    try {
      const request = mssqlCommon.bindParameters({
        request: pool.request(),
        parameters,
      });
      const result = await request.query<Record<string, unknown>>(query);
      const sets = (result.recordsets ?? []).map((set) => [...set]);
      const rows = sets[0] ?? [];
      return {
        rows,
        result_sets: sets,
        row_count: rows.length,
        rows_affected: (result.rowsAffected ?? []).reduce((a, b) => a + b, 0),
      };
    } finally {
      await pool.close();
    }
  },
});
