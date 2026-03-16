import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { duneAnalyticsAuth } from '../..';
import { duneRequest } from '../common/dune-api';

interface QueryStatusResponse {
  execution_id: string;
  query_id: number;
  state: string;
  submitted_at: string;
  expires_at: string;
  execution_started_at: string;
  execution_ended_at: string;
  result_set_bytes: number;
  cancelled_at: string | null;
}

export const getQueryStatus = createAction({
  name: 'get_query_status',
  displayName: 'Get Query Status',
  description:
    'Check the current status of a query execution. Returns the state (e.g. QUERY_STATE_PENDING, QUERY_STATE_EXECUTING, QUERY_STATE_COMPLETED).',
  auth: duneAnalyticsAuth,
  props: {
    executionId: Property.ShortText({
      displayName: 'Execution ID',
      description:
        'The execution ID returned from the Execute Query action',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const data = await duneRequest<QueryStatusResponse>(
      auth as string,
      HttpMethod.GET,
      `/execution/${encodeURIComponent(propsValue.executionId)}/status`
    );

    return data;
  },
});
