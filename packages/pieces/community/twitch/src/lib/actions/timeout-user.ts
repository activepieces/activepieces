import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { HelixPage, twitchCommon } from '../common';

export const timeoutUser = createAction({
  auth: twitchAuth,
  name: 'timeout_user',
  displayName: 'Timeout User',
  description: 'Temporarily ban a user from a channel\'s chat.',
  classification: 'DESTRUCTIVE',
  audience: 'both',
  aiMetadata: {
    description:
      'Time out a user in a Twitch channel\'s chat for duration seconds (1 to 1209600 = 14 days; default channel: the connected account). Requires moderator:manage:banned_users and moderator rights. Repeating replaces the current timeout; a permanently banned user cannot be timed out. Returns broadcaster_id, moderator_id, user_id, created_at and end_time. Not idempotent: end_time moves on each call. This takes away the user\'s access or role; confirm with the user before calling it.',
    idempotent: false,
  },
  props: {
    broadcaster_id: twitchCommon.props.broadcasterId(),
    moderator_id: twitchCommon.props.moderatorId(),
    user_id: twitchCommon.props.userId({ displayName: 'User ID', description: 'Numeric Twitch ID of the user. Use Get Users to find it.' }),
    duration: Property.Number({
      displayName: 'Duration (seconds)',
      description: '1 to 1209600 (14 days).',
      required: true,
    }),
    reason: Property.ShortText({
      displayName: 'Reason',
      description: 'Up to 500 characters.',
      required: false,
    }),
  },
  outputSchema: {
    fields: [
      { key: 'broadcaster_id', label: 'Broadcaster ID' },
      { key: 'moderator_id', label: 'Moderator ID' },
      { key: 'user_id', label: 'User ID' },
      { key: 'created_at', label: 'Created At', format: 'datetime' },
      { key: 'end_time', label: 'End Time', format: 'datetime' },
    ],
  },
  async run({ auth, propsValue }) {
    const userId = twitchCommon.requiredText({ value: propsValue.user_id, label: 'User ID' });
    const duration = twitchCommon.assertInteger({ value: propsValue.duration, min: 1, max: 1209600, label: 'Duration' });
    const reason = twitchCommon.optionalText(propsValue.reason);
    if (reason !== undefined) {
      twitchCommon.assertTextLength({ value: reason, max: 500, label: 'Reason' });
    }
    const broadcasterId = await twitchCommon.resolveUserId({ auth, value: propsValue.broadcaster_id });
    const moderatorId = await twitchCommon.resolveUserId({ auth, value: propsValue.moderator_id });
    const response = await twitchCommon.request<HelixPage<Record<string, unknown>>>({
      auth,
      method: HttpMethod.POST,
      path: '/moderation/bans',
      query: { broadcaster_id: broadcasterId, moderator_id: moderatorId },
      body: { data: twitchCommon.compact({ user_id: userId, duration, reason }) },
    });
    return twitchCommon.firstItem({ page: response.body, label: 'ban' });
  },
});
