import { createAction, Property } from '@activepieces/pieces-framework';
import { cryptoPanicAuth } from '../../index';
import { fetchCryptoPanicPosts } from '../common/cryptopanic-api';

export const getLatestNews = createAction({
  name: 'get_latest_news',
  displayName: 'Get Latest News',
  description: 'Fetch the latest crypto news posts from CryptoPanic',
  auth: cryptoPanicAuth,
  props: {
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
    const { kind, currencies, regions } = context.propsValue;

    return await fetchCryptoPanicPosts({
      apiKey: apiKey ?? null,
      kind: kind ?? 'all',
      currencies: currencies ?? undefined,
      regions: regions ?? undefined,
    });
  },
});
