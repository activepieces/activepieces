import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DRIFT_API_BASE } from '../lib/drift-api';

export const getTopTraders = createAction({
  name: 'get_top_traders',
  displayName: 'Get Top Traders',
  description: 'Get the top 10 traders on Drift Protocol by total trading volume',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${DRIFT_API_BASE}/leaderboard?type=totalVolume&limit=10`,
    });
    return response.body;
  },
});
