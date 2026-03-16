import { createAction, Property } from '@activepieces/pieces-framework';
import { duneAuth } from '../..';
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
      column_types: string[];
      row_count: number;
      result_set_bytes: number;
      total_row_count: number;
    };
  };
}

export const getExecutionResults = createAction({
  name: 'get_execution_results',
  displayName: 'Get Execution Results',
  description:
    'Retrieve results for a specific execution by its execution ID.',
  auth: duneAuth,
  requireAuth: true,
  props: {
    execution_id: Property.ShortText({
      displayName: 'Execution ID',
      description: 'The execution ID to fetch results for.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of rows to return.',
      required: false,
      defaultValue: 100,
    }),
  },
  async run({ auth, propsValue }) {
    const limit = propsValue.limit ?? 100;
    const data = await duneRequest<ExecutionResultsResponse>(
      auth as string,
      `/execution/${propsValue.execution_id}/results?limit=${limit}`
    );

    return {
      execution_id: data.execution_id,
      query_id: data.query_id,
      state: data.state,
      submitted_at: data.submitted_at,
      execution_ended_at: data.execution_ended_at,
      row_count: data.result?.metadata?.row_count ?? 0,
      total_row_count: data.result?.metadata?.total_row_count ?? 0,
      column_names: data.result?.metadata?.column_names ?? [],
      rows: data.result?.rows ?? [],
    };
  },
});
