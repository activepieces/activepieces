import { createAction } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { twitchCommon } from '../common';

export const getTopGames = createAction({
  auth: twitchAuth,
  name: 'get_top_games',
  displayName: 'Get Top Categories',
  description: 'List the categories (games) with the most viewers right now.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'List Twitch categories (games) ordered by current viewer count, most watched first. Returns games[] with id, name, box_art_url (a {width}x{height} template) and igdb_id, plus count and next_cursor (null when there are no more).',
    idempotent: true,
  },
  props: {
    limit: twitchCommon.props.limit({ max: 1000 }),
  },
  outputSchema: {
    fields: [
      {
        key: 'games',
        label: 'Categories', labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Category ID' },
          { key: 'name', label: 'Name' },
          { key: 'box_art_url', label: 'Box Art URL Template' },
          { key: 'igdb_id', label: 'IGDB ID' },
        ],
      },
      ...twitchCommon.listMetaFields,
    ],
  },
  async run({ auth, propsValue }) {
    const limit = twitchCommon.validateLimitMax({ limit: propsValue.limit, max: 1000 });
    const { items, nextCursor } = await twitchCommon.paginate<Record<string, unknown>>({
      auth,
      path: '/games/top',
      limit,
    });
    return { games: items, count: items.length, next_cursor: nextCursor };
  },
});
