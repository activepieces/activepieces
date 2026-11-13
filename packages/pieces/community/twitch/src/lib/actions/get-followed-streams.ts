import { createAction } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { twitchCommon } from '../common';

export const getFollowedStreams = createAction({
  auth: twitchAuth,
  name: 'get_followed_streams',
  displayName: 'Get Followed Live Streams',
  description: 'List live streams of channels your account follows.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'List the channels the connected account follows that are live right now, sorted by viewer count. Requires user:read:follows. Returns streams[] (id, user_id, user_login, user_name, game_id, game_name, type, title, viewer_count, started_at, language, thumbnail_url template, tags, is_mature), count and next_cursor.',
    idempotent: true,
  },
  props: {
    limit: twitchCommon.props.limit({ max: 1000 }),
  },
  outputSchema: {
    fields: [
      {
        key: 'streams',
        label: 'Streams', labelKey: 'user_name',
        listItems: twitchCommon.streamFields,
      },
      ...twitchCommon.listMetaFields,
    ],
  },
  async run({ auth, propsValue }) {
    const limit = twitchCommon.validateLimitMax({ limit: propsValue.limit, max: 1000 });
    const user = await twitchCommon.getTokenUser({ auth });
    const { items, nextCursor } = await twitchCommon.paginate<Record<string, unknown>>({
      auth,
      path: '/streams/followed',
      query: { user_id: user.id },
      limit,
    });
    return {
      streams: items.map((item) => twitchCommon.omitKeys({ item, keys: ['tag_ids'] })),
      count: items.length,
      next_cursor: nextCursor,
    };
  },
});
