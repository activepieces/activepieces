import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { TRUEFI_COINGECKO_URL } from '../truefi-api';

export const getTruPrice = createAction({
  name: 'get-tru-price',
  displayName: 'Get TRU Price',
  description: 'Get TRU token price, market cap, and 24h volume from CoinGecko',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: TRUEFI_COINGECKO_URL,
    });
    const data = response.body;
    const market = data.market_data;
    return {
      symbol: data.symbol?.toUpperCase(),
      price_usd: market?.current_price?.usd ?? 0,
      market_cap: market?.market_cap?.usd ?? 0,
      volume_24h: market?.total_volume?.usd ?? 0,
      price_change_24h: market?.price_change_percentage_24h ?? 0,
    };
  },
});
