import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetAgentLinkOutputSchema } from '../../output-schemas';

export const getAgentLink = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_agent_link',
  outputSchema: elevenlabsGetAgentLinkOutputSchema,
  displayName: 'Get Agent Link',
  description: 'Get a shareable link token for an agent',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the shareable link token of an agent, used to open it in the ElevenLabs web talk page.',
    idempotent: true,
  },
  props: {
    agentId: Property.ShortText({ displayName: 'Agent ID', description: 'The agent_id from List Agents or Create Agent', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/convai/agents/${encodeURIComponent(propsValue.agentId)}/link`,
    });
    return response ?? { success: true };
  },
});
