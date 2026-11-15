import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsCreateAgentOutputSchema } from '../../output-schemas';

export const createAgent = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_create_agent',
  outputSchema: elevenlabsCreateAgentOutputSchema,
  displayName: 'Create Agent',
  description: 'Create a conversational AI agent',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Creates a conversational AI agent from a conversation_config JSON (prompt, first message, voice, language) and returns its agent_id. Start from the config of an existing agent via Get Agent. Not idempotent: each call creates another agent.',
    idempotent: false,
  },
  props: {
    conversationConfig: Property.Json({ displayName: 'Conversation Config', description: 'Agent configuration, such as {"agent": {"prompt": {"prompt": "You are..."}, "first_message": "Hi"}}', required: true }),
    platformSettings: Property.Json({ displayName: 'Platform Settings', description: 'Optional platform settings', required: false }),
    name: Property.ShortText({ displayName: 'Name', description: 'Agent name', required: false }),
    tags: Property.Array({ displayName: 'Tags', description: 'Tags for the agent', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.POST,
      path: `/v1/convai/agents/create`,
      body: elevenlabsClient.compact({ values: { conversation_config: propsValue.conversationConfig, platform_settings: propsValue.platformSettings, name: propsValue.name, tags: propsValue.tags } }),
    });
    return response ?? { success: true };
  },
});
