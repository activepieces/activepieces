import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetAgentOutputSchema } from '../../output-schemas';

export const updateAgent = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_update_agent',
  outputSchema: elevenlabsGetAgentOutputSchema,
  displayName: 'Update Agent',
  description: 'Change the settings of an agent',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Updates an agent. Only the supplied fields change; conversation_config and platform_settings are merged by the API. Use Get Agent first to see the current values.',
    idempotent: true,
  },
  props: {
    agentId: Property.ShortText({ displayName: 'Agent ID', description: 'The agent_id from List Agents or Create Agent', required: true }),
    name: Property.ShortText({ displayName: 'Name', description: 'New agent name', required: false }),
    conversationConfig: Property.Json({ displayName: 'Conversation Config', description: 'Partial configuration to change, such as {"agent": {"first_message": "Hello"}}', required: false }),
    platformSettings: Property.Json({ displayName: 'Platform Settings', description: 'Partial platform settings to change', required: false }),
    tags: Property.Array({ displayName: 'Tags', description: 'Replaces the tags', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.PATCH,
      path: `/v1/convai/agents/${encodeURIComponent(propsValue.agentId)}`,
      body: elevenlabsClient.compact({ values: { name: propsValue.name, conversation_config: propsValue.conversationConfig, platform_settings: propsValue.platformSettings, tags: propsValue.tags } }),
    });
    return response ?? { success: true };
  },
});
