import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { twitchCommon } from '../common';

export const searchChannels = createAction({
  auth: twitchAuth,
  name: 'search_channels',
  displayName: 'Search Channels',
  description: 'Search Twitch channels by name or description.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'Search Twitch channels whose name or description matches a query. Set live_only to "yes" to return only channels that are live now. Returns channels[] with id (the broadcaster ID), broadcaster_login, display_name, broadcaster_language, game_id, game_name, title, is_live, started_at (empty when offline), tags and thumbnail_url, plus count and next_cursor. Twitch stops paginating search results after a few pages.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      required: true,
    }),
    live_only: Property.StaticDropdown({
      displayName: 'Live Channels Only',
      required: false,
      defaultValue: 'no',
      options: {
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of channels to return (1-1000).',
      required: false,
      defaultValue: 20,
    }),
  },
  outputSchema: {
    fields: [
      {
        key: 'channels',
        label: 'Channels',
        labelKey: 'display_name',
        listItems: [
          { key: 'id', label: 'Broadcaster ID' },
          { key: 'broadcaster_login', label: 'Login' },
          { key: 'display_name', label: 'Display Name' },
          { key: 'broadcaster_language', label: 'Language' },
          { key: 'game_id', label: 'Category ID' },
          { key: 'game_name', label: 'Category Name' },
          { key: 'title', label: 'Title' },
          { key: 'is_live', label: 'Is Live', format: 'boolean' },
          { key: 'started_at', label: 'Started At (empty when offline)' },
          { key: 'tags', label: 'Tags' },
          { key: 'thumbnail_url', label: 'Thumbnail URL', format: 'image' },
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
    const { items, nextCursor } = await twitchCommon.paginate<TwitchChannelSearchResult>({
      auth,
      path: '/search/channels',
      query: { query, live_only: propsValue.live_only === 'yes' ? 'true' : 'false' },
      limit,
    });
    return { channels: items.map((item) => twitchCommon.omitKeys({ item, keys: ['tag_ids'] })), count: items.length, next_cursor: nextCursor };
  },
});

type TwitchChannelSearchResult = {
  [key: string]: unknown;
  id: string;
  broadcaster_login: string;
  display_name: string;
  broadcaster_language: string;
  game_id: string;
  game_name: string;
  title: string;
  is_live: boolean;
  started_at: string;
  tags: string[];
  thumbnail_url: string;
};
