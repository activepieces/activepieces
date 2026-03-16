import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { HOP_API_URLS } from '../lib/hop-api';

export const getHopPrice = createAction({
  name: 'get_hop_price',
  displayName: 'Get HOP Price',
  description: 'Get the current HOP token price, market cap, and 24h trading volume from CoinGecko',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: HOP_API_URLS.HOP_PRICE,
    });
    return response.body;
  },
});
