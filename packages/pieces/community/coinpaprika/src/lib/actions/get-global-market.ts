import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { coinpaprikaAuth } from '../../index';
import { COINPAPRIKA_BASE_URL, buildAuthHeaders } from '../common';

export const getGlobalMarket = createAction({
  name: 'get_global_market',
  auth: coinpaprikaAuth,
  displayName: 'Get Global Market Overview',
  description:
    'Fetch global cryptocurrency market data including total market cap, Bitcoin dominance, 24h volume, and number of active cryptocurrencies.',
  props: {},
  async run(context) {
    const url = `${COINPAPRIKA_BASE_URL}/global`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: buildAuthHeaders(context.auth),
    });

    const data = response.body;
    if (!data || typeof data !== 'object') {
      throw new Error('Unexpected response from CoinPaprika global endpoint.');
    }

    return data;
  },
});
