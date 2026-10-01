import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetAgentWidgetOutputSchema } from '../../output-schemas';

export const getAgentWidget = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_agent_widget',
  outputSchema: elevenlabsGetAgentWidgetOutputSchema,
  displayName: 'Get Agent Widget',
  description: 'Get the embed widget config of an agent',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the website widget configuration of an agent.',
    idempotent: true,
  },
  props: {
    agentId: Property.ShortText({ displayName: 'Agent ID', description: 'The agent_id from List Agents or Create Agent', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/convai/agents/${encodeURIComponent(propsValue.agentId)}/widget`,
    });
    return response ?? { success: true };
  },
});
