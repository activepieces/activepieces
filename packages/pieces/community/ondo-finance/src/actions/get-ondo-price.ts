import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface OndoPriceResponse {
  'ondo-finance': {
    usd: number;
    usd_market_cap: number;
    usd_24h_change: number;
  };
}

export const getOndoPrice = createAction({
  name: 'get-ondo-price',
  displayName: 'Get ONDO Token Price',
  description: 'Fetches the current ONDO token price, market cap, and 24h price change from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<OndoPriceResponse>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/simple/price?ids=ondo-finance&vs_currencies=usd&include_market_cap=true&include_24hr_change=true',
    });

    const data = response.body['ondo-finance'];

    return {
      price_usd: data.usd,
      market_cap_usd: data.usd_market_cap,
      change_24h_percent: data.usd_24h_change,
    };
  },
});
