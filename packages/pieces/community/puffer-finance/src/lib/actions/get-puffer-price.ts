import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

type CoinGeckoPrice = {
  puffer: {
    usd: number;
    usd_market_cap: number;
    usd_24h_change: number;
  };
};

export const getPufferPrice = createAction({
  name: 'get-puffer-price',
  displayName: 'Get Puffer Token Price',
  description: 'Fetch PUFFER token price, market cap, and 24h change from CoinGecko.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<CoinGeckoPrice>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/simple/price',
      queryParams: {
        ids: 'puffer',
        vs_currencies: 'usd',
        include_market_cap: 'true',
        include_24hr_change: 'true',
      },
    });

    const data = response.body.puffer;

    return {
      price_usd: data.usd,
      market_cap_usd: data.usd_market_cap,
      change_24h_pct: data.usd_24h_change,
    };
  },
});
