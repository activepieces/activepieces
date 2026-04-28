import { createAction, Property } from '@activepieces/pieces-framework';
import { giphyAuth } from '../auth';
import { giphyApiClient } from '../common';

export const searchStickersAction = createAction({
  auth: giphyAuth,
  name: 'search_stickers',
  displayName: 'Search Stickers',
  description: 'Replicates the functionality and requirements of the classic GIPHY search, but returns animated stickers rather than GIFs. ',
  props: {
    q: Property.ShortText({
      displayName: 'Q',
      description: 'Search query term or prhase.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'The maximum number of records to return.',
      required: false,
      defaultValue: 25,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'An optional results offset.',
      required: false,
      defaultValue: 0,
    }),
    rating: Property.ShortText({
      displayName: 'Rating',
      description: 'Filters results by specified rating.',
      required: false,
    }),
    lang: Property.ShortText({
      displayName: 'Lang',
      description: 'Specify default language for regional content; use a 2-letter ISO 639-1 language code.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const allItems: unknown[] = [];
    let cursor: string | undefined = undefined;
    do {
      const response = await giphyApiClient.get({
        auth, endpoint: '/stickers/search',
        queryParams: {
          limit: propsValue.limit ?? 100,
          offset: cursor,
        },
      });
      const body = response.body as Record<string, unknown>;
      const items = Array.isArray(body['data']) ? body['data'] : (Array.isArray(body['items']) ? body['items'] : [body]);
      allItems.push(...(items as unknown[]));
      cursor = typeof response.body === 'object' && response.body !== null ? (response.body as Record<string, unknown>)['next_cursor'] as string | undefined : undefined;
    } while (cursor);
    return allItems;
  },
});
