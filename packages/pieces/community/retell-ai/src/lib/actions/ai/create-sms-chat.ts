import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
export const createSmsChatAction = createAction({
  auth: retellAiAuth,
  name: 'create_sms_chat',
  classification: 'WRITE',
  displayName: 'Create SMS Chat',
  description: 'Starts an outbound SMS conversation with a phone number.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Texts a real phone number from a Retell number: the chat agent writes and sends the first SMS, then replies to the person's answers. Billed per message and subject to SMS consent rules; each run sends another first message, so never retry blindly.",
    idempotent: false,
  },
  props: {
    from_number: retellAiProps.e164Number({ displayName: 'From Number', description: 'An SMS-enabled number bought from or imported to Retell.' }),
    to_number: retellAiProps.e164Number({ displayName: 'To Number', description: 'The number to text.' }),
    agent_id: retellAiProps.id({
      displayName: 'Chat Agent ID',
      description: 'Optional chat agent ID. Empty = the outbound SMS agent bound to From Number.',
      required: false,
    }),
    agent_version: retellAiProps.agentVersion(),
    metadata: retellAiProps.metadata(),
    dynamic_variables: retellAiProps.dynamicVariables(),
  },
  outputSchema: retellSchemas.chat,
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      from_number: retellInput.e164({ value: propsValue.from_number, label: 'From Number' }),
      to_number: retellInput.e164({ value: propsValue.to_number, label: 'To Number' }),
    };
    const agentId = retellInput.optionalText(propsValue.agent_id);
    if (agentId !== undefined) {
      body['override_agent_id'] = agentId;
    }
    const version = retellInput.agentVersion({ value: propsValue.agent_version, label: 'Agent Version' });
    if (version !== undefined) {
      body['override_agent_version'] = version;
    }
    const metadata = retellInput.objectValue({ value: propsValue.metadata, label: 'Metadata' });
    if (metadata !== undefined) {
      body['metadata'] = metadata;
    }
    const variables = retellInput.stringMap({ value: propsValue.dynamic_variables, label: 'Dynamic Variables' });
    if (variables !== undefined) {
      body['retell_llm_dynamic_variables'] = variables;
    }
    const chat = await retellApiCall({ apiKey: apiKeyOf(auth), method: HttpMethod.POST, path: '/create-sms-chat', body });
    return retellMap.chat(chat);
  },
});
