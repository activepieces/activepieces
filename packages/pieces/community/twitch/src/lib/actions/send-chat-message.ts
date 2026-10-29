import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { HelixPage, twitchCommon } from '../common';

export const sendChatMessage = createAction({
  auth: twitchAuth,
  name: 'send_chat_message',
  displayName: 'Send Chat Message',
  description: 'Send a message to a channel\'s chat as your account. Requires the user:write:chat scope.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Post a chat message (max 500 characters) as the connected Twitch account into a channel\'s chat. broadcaster_id is the numeric ID of the channel (from Get Users); leave empty to post in your own channel. Optionally reply to a message with reply_parent_message_id. Fails if Twitch drops the message (for example AutoMod, banned or followers-only). Returns message_id and is_sent. Not idempotent: each call posts a new message.',
    idempotent: false,
  },
  props: {
    broadcaster_id: Property.ShortText({
      displayName: 'Broadcaster ID',
      description: 'Numeric ID of the channel to post in. Leave empty for your own channel.',
      required: false,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'Up to 500 characters.',
      required: true,
    }),
    reply_parent_message_id: Property.ShortText({
      displayName: 'Reply To Message ID',
      required: false,
    }),
  },
  outputSchema: {
    fields: [
      { key: 'message_id', label: 'Message ID' },
      { key: 'is_sent', label: 'Is Sent', format: 'boolean' },
      { key: 'broadcaster_id', label: 'Broadcaster ID' },
    ],
  },
  async run({ auth, propsValue }) {
    const message = propsValue.message;
    if (message.trim().length === 0 || message.length > 500) {
      throw new Error('Message must be between 1 and 500 characters.');
    }
    const user = await twitchCommon.getTokenUser({ auth });
    const broadcasterId = propsValue.broadcaster_id?.trim() || user.id;
    const replyTo = propsValue.reply_parent_message_id?.trim();
    const response = await twitchCommon.request<HelixPage<ChatMessageResult>>({
      auth,
      method: HttpMethod.POST,
      path: '/chat/messages',
      body: {
        broadcaster_id: broadcasterId,
        sender_id: user.id,
        message,
        ...(replyTo ? { reply_parent_message_id: replyTo } : {}),
      },
    });
    const result = response.body.data?.[0];
    if (!result || !result.is_sent) {
      throw new Error(
        `Twitch did not send the message: ${result?.drop_reason?.message ?? 'no reason given'} (${result?.drop_reason?.code ?? 'unknown'}).`
      );
    }
    return { message_id: result.message_id, is_sent: result.is_sent, broadcaster_id: broadcasterId };
  },
});

type ChatMessageResult = {
  message_id: string;
  is_sent: boolean;
  drop_reason?: { code: string; message: string } | null;
};
