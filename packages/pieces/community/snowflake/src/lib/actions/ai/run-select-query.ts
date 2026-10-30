import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../../auth';
import { toAuthValue, withSnowflake } from '../../common';
import {
  aiProps,
  READ_DEFAULT_LIMIT,
  READ_MAX_LIMIT,
} from '../../common/ai-props';
import { queryResultOutputSchema } from '../../common/output-schemas';
import {
  assertReadOnlyStatement,
  boundedInteger,
  toBind,
} from '../../common/sql';

export const runSelectQueryAction = createAction({
  name: 'run_select_query',
  classification: 'READ',
  displayName: 'Run Select Query',
  description:
    'Run one read-only SQL query (SELECT, WITH, SHOW, DESCRIBE or EXPLAIN).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Runs exactly one read-only statement (SELECT, WITH, SHOW, DESCRIBE, EXPLAIN) and returns up to Limit rows plus a truncated flag and the query ID. Statements that change data, multiple statements and SYSTEM$ functions are rejected; use the row actions to write. Pass values through Parameters with ? placeholders. Safe to retry.',
    idempotent: true,
  },
  outputSchema: queryResultOutputSchema,
  auth: snowflakeAuth,
  props: {
    sql: Property.LongText({
      displayName: 'SQL',
      description:
        'One read-only statement, e.g. `SELECT ID, EMAIL FROM ANALYTICS.PUBLIC.USERS WHERE CREATED_AT > ?`. Use ? placeholders for values.',
      required: true,
    }),
    parameters: Property.Array({
      displayName: 'Parameters',
      description: 'Values for the ? placeholders, in order.',
      required: false,
    }),
    limit: aiProps.limit(READ_DEFAULT_LIMIT, READ_MAX_LIMIT),
  },
  async run(context) {
    const { sql, parameters, limit } = context.propsValue;
    const statement = assertReadOnlyStatement(sql);
    const maxRows = boundedInteger({
      value: limit,
      defaultValue: READ_DEFAULT_LIMIT,
      min: 1,
      max: READ_MAX_LIMIT,
      label: 'Limit',
    });
    const result = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) =>
        session.query({
          sql: statement,
          binds: (parameters ?? []).map(toBind),
          maxRows,
        }),
    });
    return {
      columns: result.columns,
      rows: result.rows,
      rowCount: result.rows.length,
      totalRows: result.totalRows,
      truncated: result.truncated,
      queryId: result.queryId,
    };
  },
});
