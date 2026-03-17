import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

export const getTokenPrice = createAction({
  name: 'get_token_price',
  displayName: 'Get Token Price',
  description: 'Get the current price and market data for the ANKR token from CoinGecko.',
  props: {
    vs_currency: Property.StaticDropdown({
      displayName: 'Currency',
      description: 'The target currency to get the price in.',
      required: true,
      options: {
        options: [
          { label: 'USD', value: 'usd' },
          { label: 'EUR', value: 'eur' },
          { label: 'BTC', value: 'btc' },
          { label: 'ETH', value: 'eth' },
        ],
      },
      defaultValue: 'usd',
    }),
  },
  async run(context) {
    const { vs_currency } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.coingecko.com/api/v3/simple/price?ids=ankr-network&vs_currencies=${vs_currency}&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`,
    });

    const data = response.body as Record<string, Record<string, number>>;
    const ankrData = data['ankr-network'];

    if (!ankrData) {
      throw new Error('No price data found for ANKR token.');
    }

    return {
      token: 'ANKR',
      currency: vs_currency,
      price: ankrData[vs_currency],
      market_cap: ankrData[`${vs_currency}_market_cap`],
      volume_24h: ankrData[`${vs_currency}_24h_vol`],
      change_24h: ankrData[`${vs_currency}_24h_change`],
    };
  },
});
