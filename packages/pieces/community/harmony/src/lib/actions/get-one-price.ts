import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getOnePrice = createAction({
  name: 'get_one_price',
  displayName: 'Get ONE Price',
  description: 'Fetch the current price and market data for Harmony (ONE) token from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/harmony',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
      },
    });
    return response.body;
  },
});
