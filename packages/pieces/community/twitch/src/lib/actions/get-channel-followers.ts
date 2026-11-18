import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { twitchCommon } from '../common';

export const getChannelFollowers = createAction({
  auth: twitchAuth,
  name: 'get_channel_followers',
  displayName: 'Get Channel Followers',
  description: 'List the users who follow a channel.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'List followers of a Twitch channel (default: the connected account), newest first. Requires moderator:read:followers; the connected account must be the broadcaster or a moderator of the channel to see the list, otherwise only total is returned. Optionally pass user_id to check whether one user follows. Returns followers[] (user_id, user_login, user_name, followed_at), total (all followers), count and next_cursor.',
    idempotent: true,
  },
  props: {
    broadcaster_id: twitchCommon.props.broadcasterId(),
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: 'Only return this user, to check whether they follow.',
      required: false,
    }),
    limit: twitchCommon.props.limit({ max: 1000 }),
  },
  outputSchema: {
    fields: [
      {
        key: 'followers',
        label: 'Followers', labelKey: 'user_name',
        listItems: [
          ...twitchCommon.userFields,
          { key: 'followed_at', label: 'Followed At', format: 'datetime' },
        ],
      },
      { key: 'total', label: 'Total Followers', format: 'number' },
      ...twitchCommon.listMetaFields,
    ],
  },
  async run({ auth, propsValue }) {
    const limit = twitchCommon.validateLimitMax({ limit: propsValue.limit, max: 1000 });
    const broadcasterId = await twitchCommon.resolveUserId({ auth, value: propsValue.broadcaster_id });
    const { items, nextCursor, total } = await twitchCommon.paginate<Record<string, unknown>>({
      auth,
      path: '/channels/followers',
      query: { broadcaster_id: broadcasterId, user_id: twitchCommon.optionalText(propsValue.user_id) },
      limit,
    });
    return { followers: items, total, count: items.length, next_cursor: nextCursor };
  },
});
