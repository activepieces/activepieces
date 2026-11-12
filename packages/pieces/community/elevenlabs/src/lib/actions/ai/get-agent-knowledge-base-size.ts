import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetAgentKnowledgeBaseSizeOutputSchema } from '../../output-schemas';

export const getAgentKnowledgeBaseSize = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_agent_knowledge_base_size',
  outputSchema: elevenlabsGetAgentKnowledgeBaseSizeOutputSchema,
  displayName: 'Get Agent Knowledge Base Size',
  description: 'Get the knowledge base size of an agent',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the number of pages in the knowledge base attached to an agent.',
    idempotent: true,
  },
  props: {
    agentId: Property.ShortText({ displayName: 'Agent ID', description: 'The agent_id from List Agents or Create Agent', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/convai/agent/${encodeURIComponent(propsValue.agentId)}/knowledge-base/size`,
    });
    return response ?? { success: true };
  },
});
