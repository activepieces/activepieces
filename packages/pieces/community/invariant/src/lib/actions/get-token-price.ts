import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface CoinGeckoSimplePrice {
  [coinId: string]: {
    usd?: number;
    usd_market_cap?: number;
    usd_24h_vol?: number;
    usd_24h_change?: number;
  };
}

export const getTokenPrice = createAction({
  name: 'get_token_price',
  displayName: 'Get Token Price',
  description: 'Get the current INV token price and market data from CoinGecko.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<CoinGeckoSimplePrice>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/simple/price',
      queryParams: {
        ids: 'invariant',
        vs_currencies: 'usd',
        include_market_cap: 'true',
        include_24hr_vol: 'true',
        include_24hr_change: 'true',
      },
    });

    const data = response.body['invariant'] ?? {};

    return {
      token: 'INV',
      protocol: 'Invariant',
      price_usd: data.usd ?? null,
      market_cap_usd: data.usd_market_cap ?? null,
      volume_24h_usd: data.usd_24h_vol ?? null,
      change_24h_pct: data.usd_24h_change ?? null,
    };
  },
});
