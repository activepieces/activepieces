import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { agentlineAuth } from '../..';
import { agentlineApiCall } from '../common';

export const getAgent = createAction({
  auth: agentlineAuth,
  name: 'get_agent',
  displayName: 'Get Agent',
  description: 'Get details of a specific AI voice agent',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves the full configuration of a specific Agentline voice agent by ID, including system prompt, voice, and greeting settings.',
    idempotent: true,
  },
  props: {
    agent_id: Property.ShortText({
      displayName: 'Agent ID',
      description: 'The agent ID to look up (e.g. agt_xxx)',
      required: true,
    }),
  },
  async run(context) {
    const response = await agentlineApiCall(
      context.auth as string,
      HttpMethod.GET,
      `/v1/agents/${context.propsValue.agent_id}`,
    );
    return response.body;
  },
});
