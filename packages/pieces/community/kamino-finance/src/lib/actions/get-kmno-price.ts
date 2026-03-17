import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface CoinGeckoPrice {
  kamino: {
    usd: number;
    usd_market_cap: number;
    usd_24h_change: number;
  };
}

export const getKmnoPrice = createAction({
  name: 'get-kmno-price',
  displayName: 'Get KMNO Price',
  description: 'Fetch KMNO token price, market cap, and 24-hour change from CoinGecko',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<CoinGeckoPrice>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/simple/price',
      queryParams: {
        ids: 'kamino',
        vs_currencies: 'usd',
        include_market_cap: 'true',
        include_24hr_change: 'true',
      },
    });
    const data = response.body;
    const kmno = data.kamino;
    return {
      price: kmno.usd,
      marketCap: kmno.usd_market_cap,
      change24h: kmno.usd_24h_change,
    };
  },
});
