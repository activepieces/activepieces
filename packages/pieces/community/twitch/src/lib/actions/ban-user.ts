import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { HelixPage, twitchCommon } from '../common';

export const banUser = createAction({
  auth: twitchAuth,
  name: 'ban_user',
  displayName: 'Ban User',
  description: 'Permanently ban a user from a channel\'s chat.',
  classification: 'DESTRUCTIVE',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently ban a user from a Twitch channel\'s chat (default channel: the connected account). Requires moderator:manage:banned_users; the connected account (or moderator_id) must be a moderator. For a temporary ban use Timeout User. Fails with 400 if the user is already banned. Returns broadcaster_id, moderator_id, user_id, created_at and end_time (null for a ban). Undo with Unban User. This takes away the user\'s access or role; confirm with the user before calling it.',
    idempotent: false,
  },
  props: {
    broadcaster_id: twitchCommon.props.broadcasterId(),
    moderator_id: twitchCommon.props.moderatorId(),
    user_id: twitchCommon.props.userId({ displayName: 'User ID', description: 'Numeric Twitch ID of the user. Use Get Users to find it.' }),
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
      body: { data: twitchCommon.compact({ user_id: userId, reason }) },
    });
    return twitchCommon.firstItem({ page: response.body, label: 'ban' });
  },
});
