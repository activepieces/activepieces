import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { duneAnalyticsAuth } from '../..';
import { duneRequest } from '../common/dune-api';

interface ExecuteQueryResponse {
  execution_id: string;
  state: string;
}

export const executeQuery = createAction({
  name: 'execute_query',
  displayName: 'Execute Query',
  description:
    'Execute a saved Dune query by its ID. Returns an execution ID that can be used to check status and fetch results.',
  auth: duneAnalyticsAuth,
  props: {
    queryId: Property.ShortText({
      displayName: 'Query ID',
      description:
        'The numeric ID of the Dune query to execute (found in the query URL)',
      required: true,
    }),
    parameters: Property.Object({
      displayName: 'Query Parameters',
      description:
        'Optional key-value parameters to pass to the query (for parameterized queries)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {};
    if (
      propsValue.parameters &&
      Object.keys(propsValue.parameters).length > 0
    ) {
      body['query_parameters'] = propsValue.parameters;
    }

    const data = await duneRequest<ExecuteQueryResponse>(
      auth as string,
      HttpMethod.POST,
      `/query/${encodeURIComponent(propsValue.queryId)}/execute`,
      Object.keys(body).length > 0 ? body : undefined
    );

    return data;
  },
});
