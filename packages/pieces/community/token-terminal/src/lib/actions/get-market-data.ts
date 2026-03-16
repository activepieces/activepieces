import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tokenTerminalAuth, makeRequest } from '../common/token-terminal-api';

export const getMarketData = createAction({
  auth: tokenTerminalAuth,
  name: 'getMarketData',
  displayName: 'Get Market Data',
  description: 'Get aggregated DeFi market metrics and data across all tracked protocols.',
  props: {
    metric: Property.ShortText({
      displayName: 'Metric',
      description: 'Specific metric to retrieve (e.g. revenue, fees, tvl). Leave empty for all.',
      required: false,
    }),
  },
  async run(context) {
    const { metric } = context.propsValue;
    const queryParams: Record<string, string> = {};
    if (metric) queryParams['metric'] = metric;
    return makeRequest(context.auth as string, HttpMethod.GET, '/metrics', queryParams);
  },
});
