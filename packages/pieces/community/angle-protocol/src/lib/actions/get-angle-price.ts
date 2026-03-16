import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { COINGECKO_ANGLE_URL } from '../angle-api';

export const getAnglePrice = createAction({
  name: 'get-angle-price',
  displayName: 'Get ANGLE Token Price',
  description: 'Get ANGLE token price and market data from CoinGecko',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: COINGECKO_ANGLE_URL,
    });
    const data = response.body;
    return {
      symbol: data.symbol,
      price_usd: data.market_data?.current_price?.usd ?? 0,
      market_cap: data.market_data?.market_cap?.usd ?? 0,
      volume_24h: data.market_data?.total_volume?.usd ?? 0,
      price_change_24h: data.market_data?.price_change_percentage_24h ?? 0,
    };
  },
});
