import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTokenPrice = createAction({
  name: 'get-token-price',
  displayName: 'Get Token Price',
  description: 'Fetch the current price of the EXA governance token from CoinGecko.',
  auth: undefined,
  props: {
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'The currency to get the price in (e.g. usd, eur, btc)',
      required: false,
      defaultValue: 'usd',
    }),
  },
  async run({ propsValue }) {
    const currency = propsValue.currency || 'usd';
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.coingecko.com/api/v3/simple/price?ids=exa&vs_currencies=${currency}&include_24hr_change=true&include_market_cap=true`,
    });
    return response.body;
  },
});
