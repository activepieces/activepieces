import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tokenTerminalAuth, makeRequest } from '../common/token-terminal-api';

export const getProjectMetrics = createAction({
  auth: tokenTerminalAuth,
  name: 'getProjectMetrics',
  displayName: 'Get Project Metrics',
  description: 'Retrieve revenue, fees, TVL and other financial metrics for a specific protocol.',
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description: 'The unique identifier for the project (e.g. uniswap, aave, ethereum)',
      required: true,
    }),
    metric: Property.ShortText({
      displayName: 'Metric',
      description: 'Specific metric to retrieve (e.g. revenue, fees, tvl). Leave empty for all metrics.',
      required: false,
    }),
  },
  async run(context) {
    const { project_id, metric } = context.propsValue;
    const queryParams: Record<string, string> = {};
    if (metric) queryParams['metric'] = metric;
    return makeRequest(context.auth as string, HttpMethod.GET, `/projects/${project_id}/metrics`, queryParams);
  },
});
