import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { AERODROME_API } from '../lib/aerodrome-api';

export const getAeroPrice = createAction({
  name: 'get_aero_price',
  displayName: 'Get AERO Price',
  description: 'Get current AERO token price, market cap, and 24h volume from CoinGecko',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: AERODROME_API.COINGECKO_PRICE,
    });
    return response.body;
  },
});
