import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface CoinGeckoPrice {
  goldfinch: {
    usd: number;
    usd_market_cap: number;
    usd_24h_change: number;
  };
}

export const getGfiPrice = createAction({
  name: 'get-gfi-price',
  displayName: 'Get GFI Token Price',
  description: 'Fetch the current GFI token price, market cap, and 24-hour change from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<CoinGeckoPrice>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/simple/price',
      queryParams: {
        ids: 'goldfinch',
        vs_currencies: 'usd',
        include_market_cap: 'true',
        include_24hr_change: 'true',
      },
    });

    const data = response.body.goldfinch;

    return {
      token: 'GFI',
      priceUsd: data.usd,
      marketCapUsd: data.usd_market_cap,
      change24hPercent: data.usd_24h_change,
    };
  },
});
