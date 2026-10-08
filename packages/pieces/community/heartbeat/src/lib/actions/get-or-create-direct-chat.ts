import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';

export const getOrCreateDirectChatAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_get_or_create_direct_chat',
  classification: 'WRITE',
  displayName: 'Get Direct Chat',
  description: 'Returns the direct chat between two users, creating an empty one if none exists.',
  audience: 'both',
  aiMetadata: {
    description: 'Returns the chat ID and link of the direct chat between two users, creating an empty chat if they have none (no message is sent). Use to get a chat ID for List Direct Messages or a link to share. Calling again returns the same chat, so it is idempotent.',
    idempotent: true,
  },
  props: {
    userId1: heartbeatProps.id({ displayName: 'First User ID', description: 'Use List Members to find the ID.', required: true }),
    userId2: heartbeatProps.id({ displayName: 'Second User ID', description: 'Use List Members to find the ID.', required: true }),
  },
  outputSchema: heartbeatOutputSchemas.directChat,
  async run({ auth, propsValue }) {
    const userID1 = heartbeatApi.uuid({ value: propsValue.userId1, label: 'First User ID' });
    const userID2 = heartbeatApi.uuid({ value: propsValue.userId2, label: 'Second User ID' });
    if (userID1 === userID2) {
      throw new Error('The two user IDs must be different.');
    }
    return heartbeatApi.request<Record<string, unknown>>({
      token: auth.secret_text,
      method: HttpMethod.PUT,
      path: '/directChats',
      operation: 'get direct chat',
      body: { userID1, userID2 },
    });
  },
});
