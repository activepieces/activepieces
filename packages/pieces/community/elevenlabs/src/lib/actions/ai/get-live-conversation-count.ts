import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetLiveConversationCountOutputSchema } from '../../output-schemas';

export const getLiveConversationCount = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_live_conversation_count',
  outputSchema: elevenlabsGetLiveConversationCountOutputSchema,
  displayName: 'Get Live Conversation Count',
  description: 'Count the conversations happening now',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns how many conversations are live right now, optionally for one agent.',
    idempotent: true,
  },
  props: {
    agentId: Property.ShortText({ displayName: 'Agent ID', description: 'Only this agent', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/convai/analytics/live-count`,
      queryParams: { agent_id: propsValue.agentId },
    });
    return response ?? { success: true };
  },
});
