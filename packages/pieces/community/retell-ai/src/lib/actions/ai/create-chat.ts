import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
export const createChatAction = createAction({
  auth: retellAiAuth,
  name: 'create_chat',
  classification: 'WRITE',
  displayName: 'Create Chat',
  description: 'Starts a text chat session with a chat agent.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Starts a new text chat session with a Retell chat agent and returns its chat_id; then use Send Chat Message for each user turn and End Chat when done. Each run opens another session.',
    idempotent: false,
  },
  props: {
    agent_id: retellAiProps.id({ displayName: 'Chat Agent ID', description: 'Chat agent ID. Use List Chat Agents to find it.' }),
    agent_version: retellAiProps.agentVersion(),
    metadata: retellAiProps.metadata(),
    dynamic_variables: retellAiProps.dynamicVariables(),
  },
  outputSchema: retellSchemas.chat,
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      agent_id: retellInput.requiredText({ value: propsValue.agent_id, label: 'Chat Agent ID' }),
    };
    const version = retellInput.agentVersion({ value: propsValue.agent_version, label: 'Agent Version' });
    if (version !== undefined) {
      body['agent_version'] = version;
    }
    const metadata = retellInput.objectValue({ value: propsValue.metadata, label: 'Metadata' });
    if (metadata !== undefined) {
      body['metadata'] = metadata;
    }
    const variables = retellInput.stringMap({ value: propsValue.dynamic_variables, label: 'Dynamic Variables' });
    if (variables !== undefined) {
      body['retell_llm_dynamic_variables'] = variables;
    }
    const chat = await retellApiCall({ apiKey: apiKeyOf(auth), method: HttpMethod.POST, path: '/create-chat', body });
    return retellMap.chat(chat);
  },
});
