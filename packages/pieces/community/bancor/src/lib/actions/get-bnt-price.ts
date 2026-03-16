import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { COINGECKO_BNT_URL } from '../bancor-api';

export const getBntPrice = createAction({
  name: 'get-bnt-price',
  displayName: 'Get BNT Price',
  description: 'Get BNT token price and market data from CoinGecko',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: COINGECKO_BNT_URL,
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
