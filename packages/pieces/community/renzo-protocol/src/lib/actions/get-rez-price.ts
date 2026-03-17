import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

type CoinGeckoPrice = {
  renzo: {
    usd: number;
    usd_market_cap: number;
    usd_24h_change: number;
  };
};

export const getRezPrice = createAction({
  name: 'get-rez-price',
  displayName: 'Get REZ Price',
  description: 'Fetch REZ token price, market cap, and 24h change from CoinGecko',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<CoinGeckoPrice>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/simple/price',
      queryParams: {
        ids: 'renzo',
        vs_currencies: 'usd',
        include_market_cap: 'true',
        include_24hr_change: 'true',
      },
    });
    const rez = response.body.renzo;
    return {
      token: 'REZ',
      price: rez.usd,
      priceFormatted: `$${rez.usd.toFixed(6)}`,
      marketCap: rez.usd_market_cap,
      marketCapFormatted: `$${(rez.usd_market_cap / 1e6).toFixed(2)}M`,
      change24h: rez.usd_24h_change,
      change24hFormatted: `${rez.usd_24h_change.toFixed(2)}%`,
    };
  },
});
