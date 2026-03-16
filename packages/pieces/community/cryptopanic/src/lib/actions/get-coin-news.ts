import { createAction, Property } from '@activepieces/pieces-framework';
import { cryptoPanicAuth } from '../../index';
import { fetchCryptoPanicPosts } from '../common/cryptopanic-api';

export const getCoinNews = createAction({
  name: 'get_coin_news',
  displayName: 'Get News for Specific Coins',
  description: 'Fetch news for specific cryptocurrencies from CryptoPanic',
  auth: cryptoPanicAuth,
  props: {
    currencies: Property.ShortText({
      displayName: 'Currencies',
      description: 'Comma-separated list of currency symbols (e.g. BTC,ETH)',
      required: true,
    }),
    kind: Property.StaticDropdown({
      displayName: 'Kind',
      description: 'Filter by content kind (news, media, or all)',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'News', value: 'news' },
          { label: 'Media', value: 'media' },
        ],
      },
    }),
    regions: Property.ShortText({
      displayName: 'Regions',
      description: 'Comma-separated language codes (e.g. en,de)',
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth as string | null | undefined;
    const { currencies, kind, regions } = context.propsValue;

    return await fetchCryptoPanicPosts({
      apiKey: apiKey ?? null,
      currencies: (currencies ?? '').trim(),
      kind: kind ?? 'all',
      regions: regions ?? undefined,
    });
  },
});
