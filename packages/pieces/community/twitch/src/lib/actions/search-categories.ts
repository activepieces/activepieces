import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { twitchCommon } from '../common';

export const searchCategories = createAction({
  auth: twitchAuth,
  name: 'search_categories',
  displayName: 'Search Categories',
  description: 'Search Twitch categories (games) by name.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'Search Twitch categories (games) whose name matches a query. Use it to find the category ID that Get Live Streams, Get Clips and Update Channel Info take as game_id. Returns categories[] with id, name and box_art_url, plus count and next_cursor.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of categories to return (1-1000).',
      required: false,
      defaultValue: 20,
    }),
  },
  outputSchema: {
    fields: [
      {
        key: 'categories',
        label: 'Categories',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Category ID' },
          { key: 'name', label: 'Name' },
          { key: 'box_art_url', label: 'Box Art URL', format: 'image' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'next_cursor', label: 'Next Cursor' },
    ],
  },
  async run({ auth, propsValue }) {
    const query = propsValue.query.trim();
    if (query.length === 0) {
      throw new Error('Query must not be empty.');
    }
    const limit = twitchCommon.validateLimit(propsValue.limit);
    const { items, nextCursor } = await twitchCommon.paginate<TwitchCategory>({
      auth,
      path: '/search/categories',
      query: { query },
      limit,
    });
    return { categories: items, count: items.length, next_cursor: nextCursor };
  },
});

type TwitchCategory = {
  id: string;
  name: string;
  box_art_url: string;
};
