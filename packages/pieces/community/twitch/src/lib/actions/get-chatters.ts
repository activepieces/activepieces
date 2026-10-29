import { createAction } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { twitchCommon } from '../common';

export const getChatters = createAction({
  auth: twitchAuth,
  name: 'get_chatters',
  displayName: 'Get Chatters',
  description: 'List the users currently connected to a channel\'s chat.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'List users connected to a Twitch channel\'s chat (default: the connected account\'s channel). Requires moderator:read:chatters; the connected account (or moderator_id) must be the broadcaster or a moderator. The list can lag a few minutes. Returns chatters[] (user_id, user_login, user_name), total, count and next_cursor.',
    idempotent: true,
  },
  props: {
    broadcaster_id: twitchCommon.props.broadcasterId(),
    moderator_id: twitchCommon.props.moderatorId(),
    limit: twitchCommon.props.limit({ max: 5000 }),
  },
  outputSchema: {
    fields: [
      {
        key: 'chatters',
        label: 'Chatters', labelKey: 'user_name',
        listItems: twitchCommon.userFields,
      },
      { key: 'total', label: 'Total', format: 'number' },
      ...twitchCommon.listMetaFields,
    ],
  },
  async run({ auth, propsValue }) {
    const limit = twitchCommon.validateLimitMax({ limit: propsValue.limit, max: 5000 });
    const broadcasterId = await twitchCommon.resolveUserId({ auth, value: propsValue.broadcaster_id });
    const moderatorId = await twitchCommon.resolveUserId({ auth, value: propsValue.moderator_id });
    const { items, nextCursor, total } = await twitchCommon.paginate<Record<string, unknown>>({
      auth,
      path: '/chat/chatters',
      query: { broadcaster_id: broadcasterId, moderator_id: moderatorId },
      limit,
      pageSize: 1000,
    });
    return { chatters: items, total, count: items.length, next_cursor: nextCursor };
  },
});
