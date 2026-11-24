import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../../auth';
import { toAuthValue, withSnowflake } from '../../common';
import {
  aiProps,
  READ_DEFAULT_LIMIT,
  READ_MAX_LIMIT,
} from '../../common/ai-props';
import { queryStatusOutputSchema } from '../../common/output-schemas';
import { boundedInteger } from '../../common/sql';
import { QUERY_ID } from '../../common/query-id';

const RUNNING = [
  'RUNNING',
  'QUEUED',
  'RESUMING_WAREHOUSE',
  'QUEUED_REPARING_WAREHOUSE',
  'NO_DATA',
  'BLOCKED',
];
const ERROR = [
  'ABORTING',
  'FAILED_WITH_ERROR',
  'ABORTED',
  'FAILED_WITH_INCIDENT',
  'DISCONNECTED',
];

export const getQueryStatusAction = createAction({
  name: 'get_query_status',
  classification: 'READ',
  displayName: 'Get Query Status',
  description:
    'Get the status of a query by its query ID, and its rows once it succeeded.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the status (RUNNING, SUCCESS, FAILED_WITH_ERROR, ABORTED, …) of a query by query ID, and when Include Results is on and it succeeded, up to Limit result rows via RESULT_SCAN. Only queries run by the same user in the last 24 hours are visible. Safe to retry.',
    idempotent: true,
  },
  outputSchema: queryStatusOutputSchema,
  auth: snowflakeAuth,
  props: {
    queryId: Property.ShortText({
      displayName: 'Query ID',
      description:
        'The query ID (UUID) from a previous action or from List Query History.',
      required: true,
    }),
    includeResults: Property.Checkbox({
      displayName: 'Include Results',
      description: 'Fetch the result rows when the query succeeded.',
      required: false,
      defaultValue: false,
    }),
    limit: aiProps.limit(READ_DEFAULT_LIMIT, READ_MAX_LIMIT),
  },
  async run(context) {
    const { queryId, includeResults, limit } = context.propsValue;
    const id = queryId.trim();
    if (!QUERY_ID.test(id)) {
      throw new Error(
        'Query ID must be a Snowflake query UUID such as 01b2c3d4-0000-1234-0000-0001a2b3c4d5.'
      );
    }
    const maxRows = boundedInteger({
      value: limit,
      defaultValue: READ_DEFAULT_LIMIT,
      min: 1,
      max: READ_MAX_LIMIT,
      label: 'Limit',
    });
    return withSnowflake({
      auth: toAuthValue(context.auth),
      fn: async (session) => {
        const status = await session.getQueryStatus(id);
        const rows: Record<string, unknown>[] = [];
        const output = {
          queryId: id,
          status,
          isRunning: RUNNING.includes(status),
          isError: ERROR.includes(status),
          rows,
          rowCount: 0,
          truncated: false,
        };
        if (includeResults && status === 'SUCCESS') {
          const result = await session.query({
            sql: 'SELECT * FROM TABLE(RESULT_SCAN(?))',
            binds: [id],
            maxRows,
          });
          output.rows = result.rows;
          output.rowCount = result.rows.length;
          output.truncated = result.truncated;
        }
        return output;
      },
    });
  },
});
