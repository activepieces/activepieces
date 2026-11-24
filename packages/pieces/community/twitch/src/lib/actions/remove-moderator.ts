import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { twitchCommon } from '../common';

export const removeModerator = createAction({
  auth: twitchAuth,
  name: 'remove_moderator',
  displayName: 'Remove Moderator',
  description: 'Remove a user\'s moderator status in your channel.',
  classification: 'DESTRUCTIVE',
  audience: 'both',
  aiMetadata: {
    description:
      'Remove moderator status from a user in the connected account\'s own Twitch channel. Requires channel:manage:moderators. Twitch answers 400 if the user is not a moderator, so a repeat call fails. Returns success, broadcaster_id and user_id. This takes away the user\'s access or role; confirm with the user before calling it.',
    idempotent: false,
  },
  props: {
    user_id: twitchCommon.props.userId({ displayName: 'User ID', description: 'Numeric Twitch ID of the user. Use Get Users to find it.' }),
  },
  outputSchema: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'broadcaster_id', label: 'Broadcaster ID' },
      { key: 'user_id', label: 'User ID' },
    ],
  },
  async run({ auth, propsValue }) {
    const userId = twitchCommon.requiredText({ value: propsValue.user_id, label: 'User ID' });
    const user = await twitchCommon.getTokenUser({ auth });
    await twitchCommon.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: '/moderation/moderators',
      query: { broadcaster_id: user.id, user_id: userId },
    });
    return { success: true, broadcaster_id: user.id, user_id: userId };
  },
});
