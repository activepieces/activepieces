import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
export const getAgentByIdAction = createAction({
  auth: retellAiAuth,
  name: 'get_agent_by_id',
  classification: 'READ',
  displayName: 'Get Agent by ID',
  description: 'Returns one voice agent.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one Retell voice agent: name, voice, language, webhook URL, response engine (LLM or conversation flow ID) and publish state, for the latest or a given version. Use Get Chat Agent for chat agents. Read-only.',
    idempotent: true,
  },
  props: {
    agent_id: retellAiProps.id({ displayName: 'Agent ID', description: 'Voice agent ID. Use List Agents to find it.' }),
    version: Property.Number({ displayName: 'Version', description: 'Optional version number. Empty = latest.', required: false }),
  },
  outputSchema: retellSchemas.agent,
  async run({ auth, propsValue }) {
    const agent = await retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.GET,
      path: `/get-agent/${retellInput.seg({ value: propsValue.agent_id, label: 'Agent ID' })}`,
      query: { version: retellInput.optionalInteger({ value: propsValue.version, label: 'Version', min: 0 }) },
      retryRateLimit: true,
    });
    return retellMap.agent(agent);
  },
});
