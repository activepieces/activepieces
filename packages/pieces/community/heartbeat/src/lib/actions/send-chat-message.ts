import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';
import { heartbeatMessages } from '../common/messages';

export const sendChatMessageAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_send_chat_message',
  classification: 'WRITE',
  displayName: 'Send Channel Chat Message',
  description: 'Sends a message to a chat channel.',
  audience: 'both',
  aiMetadata: {
    description: 'Sends a message to a chat channel (type CHAT from List Channels) as the API-key admin or another admin; members of the channel can be notified. Returns the message ID when it can be matched right after sending, otherwise null. Not idempotent: each call sends another message.',
    idempotent: false,
  },
  props: {
    channelId: heartbeatProps.id({ displayName: 'Channel ID', description: 'A chat channel. Use List Channels to find the ID.', required: true }),
    text: heartbeatProps.richText({ displayName: 'Text', required: true }),
    fromUserId: heartbeatProps.author({ displayName: 'Sender (Admin User ID)' }),
  },
  outputSchema: heartbeatOutputSchemas.sentChatMessage,
  async run({ auth, propsValue }) {
    const channelId = heartbeatApi.uuid({ value: propsValue.channelId, label: 'Channel ID' });
    const text = heartbeatApi.richText({ value: propsValue.text, label: 'Text' });
    const fromUserId = heartbeatApi.optionalUuid({ value: propsValue.fromUserId, label: 'Sender (Admin User ID)' });
    const sentAfter = Date.now();
    await heartbeatApi.request({
      token: auth.secret_text,
      method: HttpMethod.PUT,
      path: `/chatChannel/${channelId}/message`,
      operation: 'send chat message',
      body: { text, from: fromUserId },
    });
    const lookup = await heartbeatApi.afterWrite({
      what: 'the sent message',
      load: async () => {
        const recent = await heartbeatApi.request<unknown>({
          token: auth.secret_text,
          method: HttpMethod.GET,
          path: `/chatChannel/${channelId}/messages`,
          operation: 'list chat messages',
          query: { limit: 10 },
        });
        const messages = heartbeatApi.recordList(heartbeatApi.isRecord(recent) ? recent['data'] : undefined);
        return heartbeatMessages.findSentMessage({ messages, text, senderId: fromUserId, sentAfter });
      },
    });
    const message = lookup.value;
    return {
      channelId,
      sent: true,
      messageId: typeof message?.['id'] === 'string' ? message['id'] : null,
      message,
      lookupError: lookup.lookupError,
    };
  },
});
