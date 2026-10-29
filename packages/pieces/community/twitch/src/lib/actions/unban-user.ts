import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { twitchCommon } from '../common';

export const unbanUser = createAction({
  auth: twitchAuth,
  name: 'unban_user',
  displayName: 'Unban User',
  description: 'Remove a ban or timeout from a user.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Remove a ban or an active timeout from a user in a Twitch channel\'s chat (default channel: the connected account). Requires moderator:manage:banned_users and moderator rights. Twitch answers 400 if the user is not banned, so a repeat call fails. Returns success, broadcaster_id, moderator_id and user_id.',
    idempotent: false,
  },
  props: {
    broadcaster_id: twitchCommon.props.broadcasterId(),
    moderator_id: twitchCommon.props.moderatorId(),
    user_id: twitchCommon.props.userId({ displayName: 'User ID', description: 'Numeric Twitch ID of the banned user.' }),
  },
  outputSchema: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'broadcaster_id', label: 'Broadcaster ID' },
      { key: 'moderator_id', label: 'Moderator ID' },
      { key: 'user_id', label: 'User ID' },
    ],
  },
  async run({ auth, propsValue }) {
    const userId = twitchCommon.requiredText({ value: propsValue.user_id, label: 'User ID' });
    const broadcasterId = await twitchCommon.resolveUserId({ auth, value: propsValue.broadcaster_id });
    const moderatorId = await twitchCommon.resolveUserId({ auth, value: propsValue.moderator_id });
    await twitchCommon.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: '/moderation/bans',
      query: { broadcaster_id: broadcasterId, moderator_id: moderatorId, user_id: userId },
    });
    return { success: true, broadcaster_id: broadcasterId, moderator_id: moderatorId, user_id: userId };
  },
});
