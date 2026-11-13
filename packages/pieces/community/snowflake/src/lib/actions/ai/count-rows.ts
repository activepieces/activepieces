import { createAction } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../../auth';
import { toAuthValue, withSnowflake } from '../../common';
import { aiProps } from '../../common/ai-props';
import { countRowsOutputSchema } from '../../common/output-schemas';
import { buildWhere, qualifiedName } from '../../common/sql';

export const countRowsAction = createAction({
  name: 'count_rows',
  classification: 'READ',
  displayName: 'Count Rows',
  description: 'Count the rows of a table that match optional filters.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the number of rows in a table that match all given filters (or all rows when no filter is given). Use before Update/Delete Rows by Filter to check how many rows a filter hits. Safe to retry.',
    idempotent: true,
  },
  outputSchema: countRowsOutputSchema,
  auth: snowflakeAuth,
  props: {
    table: aiProps.table(),
    filters: aiProps.filters(false),
  },
  async run(context) {
    const where = buildWhere(context.propsValue.filters);
    const sql = `SELECT COUNT(*) AS "count" FROM ${qualifiedName({
      value: context.propsValue.table,
      label: 'Table',
    })}${where.clause}`;
    const result = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) => session.query({ sql, binds: where.binds, maxRows: 1 }),
    });
    return { count: Number(result.rows[0]?.['count'] ?? 0) };
  },
});
