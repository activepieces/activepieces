import { createAction, Property } from '@activepieces/pieces-framework';
import { duneAuth } from '../..';
import { duneRequest } from '../common/dune-api';

interface QueryResultsResponse {
  execution_id: string;
  query_id: number;
  state: string;
  submitted_at: string;
  expires_at: string;
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

export const getQueryResults = createAction({
  name: 'get_query_results',
  displayName: 'Get Latest Query Results',
  description:
    'Fetch the most recent cached results for any Dune query.',
  auth: duneAuth,
  requireAuth: true,
  props: {
    query_id: Property.ShortText({
      displayName: 'Query ID',
      description: 'The Dune query ID to fetch results for.',
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
    const data = await duneRequest<QueryResultsResponse>(
      auth as string,
      `/query/${propsValue.query_id}/results?limit=${limit}`
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
