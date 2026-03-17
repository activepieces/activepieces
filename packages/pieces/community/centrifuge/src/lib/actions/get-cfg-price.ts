import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface CoinGeckoPrice {
  centrifuge: {
    usd: number;
    usd_market_cap: number;
    usd_24h_change: number;
  };
}

export const getCfgPrice = createAction({
  name: 'get-cfg-price',
  displayName: 'Get CFG Token Price',
  description:
    'Get the current CFG token price, market cap, and 24h change from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<CoinGeckoPrice>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/simple/price',
      queryParams: {
        ids: 'centrifuge',
        vs_currencies: 'usd',
        include_market_cap: 'true',
        include_24hr_change: 'true',
      },
    });

    const data = response.body.centrifuge;

    return {
      token: 'CFG',
      priceUsd: data.usd,
      marketCapUsd: data.usd_market_cap,
      change24hPercent: data.usd_24h_change,
    };
  },
});
