import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTokenPriceAction = createAction({
  name: 'get_token_price',
  displayName: 'Get Token Price',
  description: 'Fetch the current price of XNO (Nano) from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/simple/price',
      queryParams: {
        ids: 'nano',
        vs_currencies: 'usd',
        include_market_cap: 'true',
        include_24hr_vol: 'true',
        include_24hr_change: 'true',
      },
    });
    const data = response.body as Record<string, Record<string, number>>;
    const nano = data['nano'] ?? {};
    return {
      price_usd: nano['usd'],
      market_cap_usd: nano['usd_market_cap'],
      volume_24h_usd: nano['usd_24h_vol'],
      change_24h_percent: nano['usd_24h_change'],
    };
  },
});
