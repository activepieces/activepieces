import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface CoinGeckoPrice {
  maple: {
    usd: number;
    usd_market_cap: number;
    usd_24h_change: number;
  };
}

export const getMaplePriceAction = createAction({
  name: 'get-maple-price',
  displayName: 'Get MAPLE Token Price',
  description: 'Fetch current MAPLE token price, market cap, and 24h change from CoinGecko',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<CoinGeckoPrice>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/simple/price',
      queryParams: {
        ids: 'maple',
        vs_currencies: 'usd',
        include_market_cap: 'true',
        include_24hr_change: 'true',
      },
    });

    const mapleData = response.body.maple;

    return {
      price_usd: mapleData.usd,
      market_cap_usd: mapleData.usd_market_cap,
      change_24h_percent: mapleData.usd_24h_change,
    };
  },
});
