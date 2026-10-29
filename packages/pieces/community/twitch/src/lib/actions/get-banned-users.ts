import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { twitchCommon } from '../common';

export const getBannedUsers = createAction({
  auth: twitchAuth,
  name: 'get_banned_users',
  displayName: 'Get Banned Users',
  description: 'List users banned or timed out in your channel.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'List users banned or timed out in the connected account\'s own Twitch channel (Twitch only allows the broadcaster). Requires moderator:manage:banned_users. Optionally filter by up to 100 user_ids. Returns banned[] (user_id, user_login, user_name, expires_at (empty for permanent bans), created_at, reason, moderator_id, moderator_login, moderator_name), count and next_cursor.',
    idempotent: true,
  },
  props: {
    user_ids: Property.Array({
      displayName: 'User IDs',
      description: 'Only return these users (up to 100).',
      required: false,
    }),
    limit: twitchCommon.props.limit({ max: 1000 }),
  },
  outputSchema: {
    fields: [
      {
        key: 'banned',
        label: 'Banned Users', labelKey: 'user_name',
        listItems: [
          ...twitchCommon.userFields,
          { key: 'expires_at', label: 'Expires At' },
          { key: 'created_at', label: 'Created At', format: 'datetime' },
          { key: 'reason', label: 'Reason' },
          { key: 'moderator_id', label: 'Moderator ID' },
          { key: 'moderator_login', label: 'Moderator Login' },
          { key: 'moderator_name', label: 'Moderator Name' },
        ],
      },
      ...twitchCommon.listMetaFields,
    ],
  },
  async run({ auth, propsValue }) {
    const userIds = twitchCommon.idList({ values: propsValue.user_ids, max: 100, label: 'User IDs' });
    const limit = twitchCommon.validateLimitMax({ limit: propsValue.limit, max: 1000 });
    const user = await twitchCommon.getTokenUser({ auth });
    const { items, nextCursor } = await twitchCommon.paginate<Record<string, unknown>>({
      auth,
      path: '/moderation/banned',
      query: { broadcaster_id: user.id, user_id: userIds.length > 0 ? userIds : undefined },
      limit,
    });
    return { banned: items, count: items.length, next_cursor: nextCursor };
  },
});
