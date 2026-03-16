import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { duneAnalyticsAuth } from '../..';
import { duneRequest } from '../common/dune-api';

interface ExecutionResultsResponse {
  execution_id: string;
  query_id: number;
  state: string;
  submitted_at: string;
  execution_started_at: string;
  execution_ended_at: string;
  result: {
    rows: Record<string, unknown>[];
    metadata: {
      column_names: string[];
      result_set_bytes: number;
      total_row_count: number;
      datapoint_count: number;
      pending_time_millis: number;
      execution_time_millis: number;
    };
  };
}

export const getExecutionResults = createAction({
  name: 'get_execution_results',
  displayName: 'Get Execution Results',
  description:
    'Fetch the results of a completed query execution. Use after the execution status shows QUERY_STATE_COMPLETED.',
  auth: duneAnalyticsAuth,
  props: {
    executionId: Property.ShortText({
      displayName: 'Execution ID',
      description:
        'The execution ID returned from the Execute Query action',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of rows to return (1-1000)',
      required: false,
      defaultValue: 100,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of rows to skip for pagination',
      required: false,
      defaultValue: 0,
    }),
  },
  async run({ auth, propsValue }) {
    const limit = Math.min(1000, Math.max(1, propsValue.limit ?? 100));
    const offset = Math.max(0, propsValue.offset ?? 0);

    const queryParams: Record<string, string> = {
      limit: String(limit),
      offset: String(offset),
    };

    const data = await duneRequest<ExecutionResultsResponse>(
      auth as string,
      HttpMethod.GET,
      `/execution/${encodeURIComponent(propsValue.executionId)}/results`,
      undefined,
      queryParams
    );

    return data;
  },
});
