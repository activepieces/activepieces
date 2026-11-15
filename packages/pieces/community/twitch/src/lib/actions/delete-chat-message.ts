import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { twitchCommon } from '../common';

export const deleteChatMessage = createAction({
  auth: twitchAuth,
  name: 'delete_chat_message',
  displayName: 'Delete Chat Message',
  description: 'Delete one message from a channel\'s chat.',
  classification: 'DESTRUCTIVE',
  audience: 'both',
  aiMetadata: {
    description:
      'Delete a single chat message by message_id in a Twitch channel (default: the connected account). Requires moderator:manage:chat_messages; the connected account acts as the moderator and must have moderator rights. The message must be under 6 hours old and not from the broadcaster or a moderator. To remove all messages use Clear Chat. Returns success, broadcaster_id and message_id. A repeat call fails with 404 once the message is gone. This action is irreversible: confirm with the user before calling it.',
    idempotent: false,
  },
  props: {
    broadcaster_id: twitchCommon.props.broadcasterId(),
    message_id: Property.ShortText({
      displayName: 'Message ID',
      required: true,
    }),
  },
  outputSchema: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'broadcaster_id', label: 'Broadcaster ID' },
      { key: 'message_id', label: 'Message ID' },
    ],
  },
  async run({ auth, propsValue }) {
    const messageId = twitchCommon.requiredText({ value: propsValue.message_id, label: 'Message ID' });
    const broadcasterId = await twitchCommon.resolveUserId({ auth, value: propsValue.broadcaster_id });
    const { id: moderatorId } = await twitchCommon.getTokenUser({ auth });
    await twitchCommon.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: '/moderation/chat',
      query: { broadcaster_id: broadcasterId, moderator_id: moderatorId, message_id: messageId },
    });
    return { success: true, broadcaster_id: broadcasterId, message_id: messageId };
  },
});
