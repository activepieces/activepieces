import { createAction } from '@activepieces/pieces-framework';
import { mysqlAuth } from '../../../..';
import { mysqlAi, mysqlAiProps } from '../../../common/ai';
import { sanitizeColumnName } from '../../../common';
import { mysqlCountRowsOutputSchema } from '../../../output-schemas';

export const countRows = createAction({
  auth: mysqlAuth,
  name: 'mysql_count_rows',
  outputSchema: mysqlCountRowsOutputSchema,
  displayName: 'Count Rows',
  description: 'Counts the rows of a table that match the filters.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Returns the number of rows in a table or view matching all given filters, or the whole table without filters. Use before Update Rows or Delete Rows to check how many rows a filter hits, or instead of paging through Find Rows for a total. Read-only.',
    idempotent: true,
  },
  props: {
    table: mysqlAiProps.table,
    filters: mysqlAiProps.filters({ required: false }),
  },
  async run(context) {
    const { table, filters } = context.propsValue;
    const where = mysqlAi.buildWhere({ filters });
    const rows: Record<string, unknown>[] = await mysqlAi.withConnection({
      auth: context.auth,
      fn: (conn) => conn.query(`SELECT COUNT(*) AS count FROM ${sanitizeColumnName(table)}${where.sql}`, where.values),
    });
    return { count: Number(rows[0]?.['count'] ?? 0) };
  },
});
