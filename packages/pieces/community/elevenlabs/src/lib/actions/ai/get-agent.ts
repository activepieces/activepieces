import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetAgentOutputSchema } from '../../output-schemas';

export const getAgent = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_agent',
  outputSchema: elevenlabsGetAgentOutputSchema,
  displayName: 'Get Agent',
  description: 'Get a conversational AI agent',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns an agent with its full configuration: prompt, voice, language, tools, phone numbers and platform settings.',
    idempotent: true,
  },
  props: {
    agentId: Property.ShortText({ displayName: 'Agent ID', description: 'The agent_id from List Agents or Create Agent', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/convai/agents/${encodeURIComponent(propsValue.agentId)}`,
    });
    return response ?? { success: true };
  },
});
