import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';

export const listDirectMessagesAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_list_direct_messages',
  classification: 'SEARCH',
  displayName: 'List Direct Messages',
  description: 'Lists the 100 most recent messages of a direct chat that includes an admin.',
  audience: 'both',
  aiMetadata: {
    description: 'Returns the 100 most recent messages (sender ID, HTML content, time) of a direct chat by chat ID. Only chats that include at least one admin can be read. Get the chat ID from Get Direct Chat or the New Direct Message trigger. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    chatId: heartbeatProps.id({ displayName: 'Chat ID', description: 'Use Get Direct Chat to find the ID.', required: true }),
  },
  outputSchema: heartbeatOutputSchemas.directMessageList,
  async run({ auth, propsValue }) {
    const chatId = heartbeatApi.uuid({ value: propsValue.chatId, label: 'Chat ID' });
    const messages = heartbeatApi.recordList(
      await heartbeatApi.request<unknown>({ token: auth.secret_text, method: HttpMethod.GET, path: `/directMessages/${chatId}`, operation: 'list direct messages' }),
    );
    return { chatId, messages, count: messages.length };
  },
});
