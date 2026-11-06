import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';

export const createWebCallAction = createAction({
  auth: retellAiAuth,
  name: 'create_web_call',
  classification: 'WRITE',
  displayName: 'Create Web Call',
  description: 'Creates a browser web call and returns its access token.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Registers a browser (web) call with a Retell voice agent and returns the call ID plus a short-lived access token for the Retell web client SDK. Billed per minute once someone joins. Each run creates a new call.',
    idempotent: false,
  },
  props: {
    agent_id: retellAiProps.id({ displayName: 'Agent ID', description: 'Voice agent ID (agent_...). Use List Agents to find it.' }),
    agent_version: retellAiProps.agentVersion(),
    metadata: retellAiProps.metadata(),
    dynamic_variables: retellAiProps.dynamicVariables(),
  },
  outputSchema: retellSchemas.webCall,
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      agent_id: retellInput.requiredText({ value: propsValue.agent_id, label: 'Agent ID' }),
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
    const call = await retellApiCall({ apiKey: apiKeyOf(auth), method: HttpMethod.POST, path: '/v3/create-web-call', body });
    return retellMap.webCall(call);
  },
});
