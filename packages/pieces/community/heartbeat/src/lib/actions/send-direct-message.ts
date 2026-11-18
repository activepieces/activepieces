import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';
import { heartbeatMessages } from '../common/messages';

export const sendDirectMessageAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_send_direct_message',
  classification: 'WRITE',
  displayName: 'Send Direct Message',
  description: 'Sends a direct message from an admin to a member.',
  audience: 'both',
  aiMetadata: {
    description: 'Sends a direct message from an admin (the API-key admin, or the admin in Sender) to one member by user ID; the member is notified. Get IDs from List Members. When Sender is set it also returns the chat ID, link and message ID. Not idempotent: each call sends another message.',
    idempotent: false,
  },
  props: {
    toUserId: heartbeatProps.id({ displayName: 'Recipient User ID', description: 'Use List Members or Find Member by Email to find the ID.', required: true }),
    text: heartbeatProps.richText({ displayName: 'Text', required: true }),
    fromUserId: heartbeatProps.author({ displayName: 'Sender (Admin User ID)' }),
  },
  outputSchema: heartbeatOutputSchemas.sentDirectMessage,
  async run({ auth, propsValue }) {
    const to = heartbeatApi.uuid({ value: propsValue.toUserId, label: 'Recipient User ID' });
    const from = heartbeatApi.optionalUuid({ value: propsValue.fromUserId, label: 'Sender (Admin User ID)' });
    if (from !== undefined && from === to) {
      throw new Error('Sender and recipient must be different users.');
    }
    const text = heartbeatApi.richText({ value: propsValue.text, label: 'Text' });
    const sentAfter = Date.now();
    await heartbeatApi.request({
      token: auth.secret_text,
      method: HttpMethod.PUT,
      path: '/directMessages',
      operation: 'send direct message',
      body: { text, to, from },
    });
    if (from === undefined) {
      return { to, from: null, sent: true, chatId: null, chatUrl: null, messageId: null, lookupError: null };
    }
    const lookup = await heartbeatApi.afterWrite({
      what: 'the direct chat and sent message',
      load: async () => {
        const chat = await heartbeatApi.request<unknown>({
          token: auth.secret_text,
          method: HttpMethod.PUT,
          path: '/directChats',
          operation: 'get direct chat',
          body: { userID1: from, userID2: to },
        });
        const chatId = heartbeatApi.isRecord(chat) && typeof chat['chatID'] === 'string' ? chat['chatID'] : null;
        const chatUrl = heartbeatApi.isRecord(chat) && typeof chat['url'] === 'string' ? chat['url'] : null;
        if (chatId === null) {
          return { chatId, chatUrl, messageId: null };
        }
        const messages = heartbeatApi.recordList(
          await heartbeatApi.request<unknown>({ token: auth.secret_text, method: HttpMethod.GET, path: `/directMessages/${chatId}`, operation: 'list direct messages' }),
        );
        const message = heartbeatMessages.findSentMessage({ messages, text, senderId: from, sentAfter });
        return { chatId, chatUrl, messageId: typeof message?.['id'] === 'string' ? message['id'] : null };
      },
    });
    return {
      to,
      from,
      sent: true,
      chatId: lookup.value?.chatId ?? null,
      chatUrl: lookup.value?.chatUrl ?? null,
      messageId: lookup.value?.messageId ?? null,
      lookupError: lookup.lookupError,
    };
  },
});
