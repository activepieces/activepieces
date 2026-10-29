import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetConversationSignedUrlOutputSchema } from '../../output-schemas';

export const getConversationSignedUrl = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_conversation_signed_url',
  outputSchema: elevenlabsGetConversationSignedUrlOutputSchema,
  displayName: 'Get Conversation Signed URL',
  description: 'Get a signed URL to start a conversation',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns a short-lived signed URL for connecting to a private agent over websocket.',
    idempotent: true,
  },
  props: {
    agentId: Property.ShortText({ displayName: 'Agent ID', description: 'The agent_id from List Agents', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/convai/conversation/get-signed-url`,
      queryParams: { agent_id: propsValue.agentId },
    });
    return response ?? { success: true };
  },
});
