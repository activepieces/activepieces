import { createAction, Property } from '@activepieces/pieces-framework';
import { cryptoPanicAuth } from '../../index';
import { fetchCryptoPanicPosts } from '../common/cryptopanic-api';

export const getHotNews = createAction({
  name: 'get_hot_news',
  displayName: 'Get Hot News',
  description: 'Fetch hot/trending crypto news from CryptoPanic',
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
      kind: 'news',
      filter: 'hot',
      currencies: currencies ?? undefined,
      regions: regions ?? undefined,
    });
  },
});
