import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';

export const createPhoneCallAction = createAction({
  auth: retellAiAuth,
  name: 'create_phone_call',
  classification: 'WRITE',
  displayName: 'Create Phone Call',
  description: 'Places an outbound phone call handled by a Retell voice agent.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Places a real outbound phone call from a Retell number to a person, handled by a Retell voice agent. Billed per minute; each run dials again, so never retry blindly. Returns the call ID; use Get Call by ID after it ends to read the outcome and transcript.',
    idempotent: false,
  },
  props: {
    from_number: retellAiProps.e164Number({ displayName: 'From Number', description: 'A number bought from or imported to Retell.' }),
    to_number: retellAiProps.e164Number({ displayName: 'To Number', description: 'The number to call. Retell-bought numbers can only call US numbers.' }),
    agent_id: retellAiProps.id({
      displayName: 'Agent ID',
      description: 'Optional voice agent ID (agent_...) for this call. Empty = the outbound agent bound to From Number.',
      required: false,
    }),
    agent_version: retellAiProps.agentVersion(),
    metadata: retellAiProps.metadata(),
    dynamic_variables: retellAiProps.dynamicVariables(),
  },
  outputSchema: retellSchemas.call,
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
    const call = await retellApiCall({ apiKey: apiKeyOf(auth), method: HttpMethod.POST, path: '/v2/create-phone-call', body });
    return retellMap.call(call);
  },
});
