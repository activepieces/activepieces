import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { twitchCommon } from '../common';

export const addModerator = createAction({
  auth: twitchAuth,
  name: 'add_moderator',
  displayName: 'Add Moderator',
  description: 'Make a user a moderator of your channel.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Make a user a moderator of the connected account\'s own Twitch channel. Requires channel:manage:moderators. Twitch rejects users who are VIPs (422; remove the VIP first) and users who are already moderators (400), so a repeat call fails. Rate limit: 10 changes per 10 seconds. Returns success, broadcaster_id and user_id.',
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
      method: HttpMethod.POST,
      path: '/moderation/moderators',
      query: { broadcaster_id: user.id, user_id: userId },
    });
    return { success: true, broadcaster_id: user.id, user_id: userId };
  },
});
