import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { twitchCommon, TwitchStream } from '../common';

export const getLiveStreams = createAction({
  auth: twitchAuth,
  name: 'get_live_streams',
  displayName: 'Get Live Streams',
  description: 'List streams that are live right now, optionally filtered by streamer, category or language.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'List Twitch streams that are currently live, sorted by viewer count. Filter by streamer usernames (up to 100), a category/game ID (from Search Categories) and/or a language code such as en. With no filters it returns the most-watched live streams on Twitch. Offline streamers are simply absent from the result. Returns streams[] (id, user_id, user_login, user_name, game_id, game_name, title, viewer_count, started_at, language, thumbnail_url, tags, is_mature), count, and next_cursor (null when there are no more results).',
    idempotent: true,
  },
  props: {
    user_logins: Property.Array({
      displayName: 'Streamer Usernames or URLs',
      required: false,
    }),
    game_id: Property.ShortText({
      displayName: 'Category ID',
      description: 'Use Search Categories to find the ID.',
      required: false,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'Two-letter ISO 639-1 code, for example en.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of streams to return (1-1000).',
      required: false,
      defaultValue: 20,
    }),
  },
  outputSchema: {
    fields: [
      { key: 'streams', label: 'Streams', labelKey: 'user_name', listItems: twitchCommon.streamFields },
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'next_cursor', label: 'Next Cursor' },
    ],
  },
  async run({ auth, propsValue }) {
    const limit = twitchCommon.validateLimit(propsValue.limit);
    const logins = twitchCommon.normalizeLogins(propsValue.user_logins ?? []);
    if (logins.length > 100) {
      throw new Error('Twitch accepts at most 100 streamer usernames.');
    }
    const gameId = propsValue.game_id?.trim();
    const language = propsValue.language?.trim();
    const { items, nextCursor } = await twitchCommon.paginate<TwitchStream>({
      auth,
      path: '/streams',
      query: {
        user_login: logins.length > 0 ? logins : undefined,
        game_id: gameId ? gameId : undefined,
        language: language ? language : undefined,
      },
      limit,
    });
    return { streams: items.map((item) => twitchCommon.omitKeys({ item, keys: ['tag_ids'] })), count: items.length, next_cursor: nextCursor };
  },
});
