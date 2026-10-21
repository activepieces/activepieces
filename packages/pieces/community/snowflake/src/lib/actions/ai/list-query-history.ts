import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../../auth';
import { toAuthValue, withSnowflake } from '../../common';
import { aiProps } from '../../common/ai-props';
import { normaliseTimestamp } from '../../common/operations';
import { queryHistoryOutputSchema } from '../../common/output-schemas';
import { boundedInteger, qualifiedName } from '../../common/sql';

const STATUSES = [
  'SUCCESS',
  'FAILED_WITH_ERROR',
  'RUNNING',
  'QUEUED',
  'BLOCKED',
  'FAILED_WITH_INCIDENT',
];

export const listQueryHistoryAction = createAction({
  name: 'list_query_history',
  classification: 'SEARCH',
  displayName: 'List Query History',
  description: 'List recent queries visible to the current role.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists recent queries (last 7 days, newest first) from INFORMATION_SCHEMA.QUERY_HISTORY with ID, text, status, user, warehouse, timing and error. Use to find a query ID for Get Query Status or to inspect failures; optionally filter by status. Safe to retry.',
    idempotent: true,
  },
  outputSchema: queryHistoryOutputSchema,
  auth: snowflakeAuth,
  props: {
    database: aiProps.database(false),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Only return queries with this execution status.',
      required: false,
      options: { options: STATUSES.map((value) => ({ label: value, value })) },
    }),
    limit: aiProps.limit(50, 1000),
  },
  async run(context) {
    const { database, status, limit } = context.propsValue;
    const max = boundedInteger({
      value: limit,
      defaultValue: 50,
      min: 1,
      max: 1000,
      label: 'Limit',
    });
    if (status && !STATUSES.includes(status)) {
      throw new Error(`Status must be one of ${STATUSES.join(', ')}.`);
    }
    const prefix =
      database && database.trim() !== ''
        ? `${qualifiedName({
            value: database,
            maxParts: 1,
            label: 'Database',
          })}.`
        : '';
    const binds: (string | number)[] = [status ? 10000 : max];
    let sql = `SELECT QUERY_ID, QUERY_TEXT, EXECUTION_STATUS, USER_NAME, ROLE_NAME, WAREHOUSE_NAME, START_TIME, END_TIME, TOTAL_ELAPSED_TIME, ROWS_PRODUCED, ERROR_MESSAGE FROM TABLE(${prefix}INFORMATION_SCHEMA.QUERY_HISTORY(RESULT_LIMIT => ?))`;
    if (status) {
      sql += ' WHERE EXECUTION_STATUS = ?';
      binds.push(status);
    }
    sql += ` ORDER BY START_TIME DESC LIMIT ${max}`;
    const result = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) => session.query({ sql, binds, maxRows: max }),
    });
    const items = result.rows.map((row) => ({
      query_id: row['QUERY_ID'] ?? null,
      query_text: row['QUERY_TEXT'] ?? null,
      execution_status: row['EXECUTION_STATUS'] ?? null,
      user_name: row['USER_NAME'] ?? null,
      role_name: row['ROLE_NAME'] ?? null,
      warehouse_name: row['WAREHOUSE_NAME'] ?? null,
      start_time: normaliseTimestamp(row['START_TIME']),
      end_time: normaliseTimestamp(row['END_TIME']),
      total_elapsed_time: row['TOTAL_ELAPSED_TIME'] ?? null,
      rows_produced: row['ROWS_PRODUCED'] ?? null,
      error_message: row['ERROR_MESSAGE'] ?? null,
    }));
    return { items, count: items.length, truncated: items.length === max };
  },
});
