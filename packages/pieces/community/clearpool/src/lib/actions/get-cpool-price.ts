import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { COINGECKO_CLEARPOOL_URL } from '../clearpool-api';

export const getCpoolPrice = createAction({
  name: 'get-cpool-price',
  displayName: 'Get CPOOL Price',
  description: 'Get Clearpool (CPOOL) token price data from CoinGecko',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: COINGECKO_CLEARPOOL_URL,
    });
    const data = response.body;
    const market = data.market_data ?? {};
    return {
      symbol: data.symbol?.toUpperCase() ?? 'CPOOL',
      price_usd: market.current_price?.usd ?? 0,
      market_cap: market.market_cap?.usd ?? 0,
      volume_24h: market.total_volume?.usd ?? 0,
      price_change_24h: market.price_change_percentage_24h ?? 0,
    };
  },
});
