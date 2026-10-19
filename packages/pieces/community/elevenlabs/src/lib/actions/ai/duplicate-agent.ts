import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsCreateAgentOutputSchema } from '../../output-schemas';

export const duplicateAgent = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_duplicate_agent',
  outputSchema: elevenlabsCreateAgentOutputSchema,
  displayName: 'Duplicate Agent',
  description: 'Copy an agent',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Creates a copy of an agent, optionally under a new name, and returns the new agent_id. Not idempotent: each call creates another agent.',
    idempotent: false,
  },
  props: {
    agentId: Property.ShortText({ displayName: 'Agent ID', description: 'The agent_id from List Agents or Create Agent', required: true }),
    name: Property.ShortText({ displayName: 'Name', description: 'Name of the copy', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.POST,
      path: `/v1/convai/agents/${encodeURIComponent(propsValue.agentId)}/duplicate`,
      body: elevenlabsClient.compact({ values: { name: propsValue.name } }),
    });
    return response ?? { success: true };
  },
});
