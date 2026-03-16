import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { duneAnalyticsAuth } from '../..';
import { duneRequest } from '../common/dune-api';

interface LatestResultsResponse {
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

export const getLatestResults = createAction({
  name: 'get_latest_results',
  displayName: 'Get Latest Results',
  description:
    'Get the latest cached results for a query without triggering a new execution. This is the fastest and most cost-effective option for retrieving query data.',
  auth: duneAnalyticsAuth,
  props: {
    queryId: Property.ShortText({
      displayName: 'Query ID',
      description:
        'The numeric ID of the Dune query (found in the query URL)',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of rows to return (1-1000)',
      required: false,
      defaultValue: 100,
    }),
    filters: Property.ShortText({
      displayName: 'Filters',
      description:
        'Optional filter expression to apply to results (e.g. "block_time > 2023-01-01")',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const limit = Math.min(1000, Math.max(1, propsValue.limit ?? 100));

    const queryParams: Record<string, string> = {
      limit: String(limit),
    };

    if (propsValue.filters) {
      queryParams['filters'] = propsValue.filters;
    }

    const data = await duneRequest<LatestResultsResponse>(
      auth as string,
      HttpMethod.GET,
      `/query/${encodeURIComponent(propsValue.queryId)}/results`,
      undefined,
      queryParams
    );

    return data;
  },
});
