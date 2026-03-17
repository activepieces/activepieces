import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface CoinGeckoPrice {
  spark: {
    usd: number;
    usd_market_cap: number;
    usd_24h_change: number;
  };
}

export const getSpkPrice = createAction({
  name: 'get-spk-price',
  displayName: 'Get SPK Price',
  description: 'Fetch SPK token price, market cap, and 24h change from CoinGecko',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<CoinGeckoPrice>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/simple/price?ids=spark&vs_currencies=usd&include_market_cap=true&include_24hr_change=true',
    });

    const data = response.body;
    const sparkData = data.spark;

    return {
      price: sparkData.usd,
      priceFormatted: `$${sparkData.usd.toFixed(6)}`,
      marketCap: sparkData.usd_market_cap,
      marketCapFormatted: `$${(sparkData.usd_market_cap / 1e6).toFixed(2)}M`,
      change24h: sparkData.usd_24h_change,
      change24hFormatted: `${sparkData.usd_24h_change.toFixed(2)}%`,
      timestamp: new Date().toISOString(),
    };
  },
});
