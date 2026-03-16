import { createAction, Property } from '@activepieces/pieces-framework';
import { cryptoPanicAuth } from '../../index';
import { fetchCryptoPanicPosts } from '../common/cryptopanic-api';

export const getBullishPosts = createAction({
  name: 'get_bullish_posts',
  displayName: 'Get Bullish Posts',
  description: 'Fetch bullish sentiment posts from CryptoPanic',
  auth: cryptoPanicAuth,
  props: {
    currencies: Property.ShortText({
      displayName: 'Currencies',
      description: 'Comma-separated list of currency symbols (e.g. BTC,ETH)',
      required: false,
    }),
    regions: Property.ShortText({
      displayName: 'Regions',
      description: 'Comma-separated language codes (e.g. en,de)',
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth as string | null | undefined;
    const { currencies, regions } = context.propsValue;

    return await fetchCryptoPanicPosts({
      apiKey: apiKey ?? null,
      filter: 'bullish',
      currencies: currencies ?? undefined,
      regions: regions ?? undefined,
    });
  },
});
