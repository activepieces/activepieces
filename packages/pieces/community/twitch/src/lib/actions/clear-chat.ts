import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { twitchCommon } from '../common';

export const clearChat = createAction({
  auth: twitchAuth,
  name: 'clear_chat',
  displayName: 'Clear Chat',
  description: 'Remove all messages from a channel\'s chat.',
  classification: 'DESTRUCTIVE',
  audience: 'both',
  aiMetadata: {
    description:
      'Remove every message from a Twitch channel\'s chat (default: the connected account) for all viewers. Requires moderator:manage:chat_messages and moderator rights. To delete one message use Delete Chat Message. Cannot be undone. Returns success and broadcaster_id. This action is irreversible: confirm with the user before calling it.',
    idempotent: true,
  },
  props: {
    broadcaster_id: twitchCommon.props.broadcasterId(),
    moderator_id: twitchCommon.props.moderatorId(),
  },
  outputSchema: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'broadcaster_id', label: 'Broadcaster ID' },
    ],
  },
  async run({ auth, propsValue }) {
    const broadcasterId = await twitchCommon.resolveUserId({ auth, value: propsValue.broadcaster_id });
    const moderatorId = await twitchCommon.resolveUserId({ auth, value: propsValue.moderator_id });
    await twitchCommon.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: '/moderation/chat',
      query: { broadcaster_id: broadcasterId, moderator_id: moderatorId },
    });
    return { success: true, broadcaster_id: broadcasterId };
  },
});
