import { createAction, Property } from '@activepieces/pieces-framework';
import { giphyAuth } from '../auth';
import { giphyApiClient } from '../common';

export const trendingStickersAction = createAction({
  auth: giphyAuth,
  name: 'trending_stickers',
  displayName: 'Trending Stickers',
  description: 'Fetch Stickers currently trending online. Hand curated by the GIPHY editorial team. Returns 25 results by default. ',
  props: {
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
  },
  async run({ auth, propsValue }) {
    const allItems: unknown[] = [];
    let cursor: string | undefined = undefined;
    do {
      const response = await giphyApiClient.get({
        auth, endpoint: '/stickers/trending',
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
