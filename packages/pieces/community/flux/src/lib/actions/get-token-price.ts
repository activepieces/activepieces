import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTokenPrice = createAction({
  name: 'get_token_price',
  displayName: 'Get Token Price',
  description: 'Fetch the current FLUX token price in USD from CoinGecko.',
  props: {
    vsCurrency: Property.ShortText({
      displayName: 'vs Currency',
      description: 'The target currency for price (e.g. usd, eur, btc)',
      required: false,
      defaultValue: 'usd',
    }),
  },
  async run(context) {
    const currency = context.propsValue.vsCurrency || 'usd';
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.coingecko.com/api/v3/simple/price?ids=flux&vs_currencies=${currency}`,
    });
    return {
      token: 'FLUX',
      currency,
      price: (response.body as Record<string, Record<string, number>>)['flux']?.[currency],
      source: 'CoinGecko',
    };
  },
});
