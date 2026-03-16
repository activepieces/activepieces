import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DRIFT_API_BASE } from '../lib/drift-api';

export const getMarkets = createAction({
  name: 'get_markets',
  displayName: 'Get Markets',
  description: 'Get all available perpetual markets on Drift Protocol',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${DRIFT_API_BASE}/markets`,
    });
    return response.body;
  },
});
