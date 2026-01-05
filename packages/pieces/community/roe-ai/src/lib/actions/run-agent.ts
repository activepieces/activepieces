import { createAction, Property } from '@activepieces/pieces-framework';
import { roeAiAuth } from '../common/auth';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
export const runAgent = createAction({
  auth: roeAiAuth,
  name: 'runAgent',
  displayName: 'Run Agent',
  description:
    'Execute an agent with provided inputs and return results immediately',
  props: {
    agent_id: Property.ShortText({
      displayName: 'Agent ID',
      description: 'The UUID of the agent to run',
      required: true,
    }),
    agent_input: Property.Object({
      displayName: 'Agent Input',
      description:
        'Dynamic input fields based on agent configuration. Can include text or file inputs.',
      required: true,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      description: 'Optional metadata as JSON object',
      required: false,
    }),
  },
  async run(context) {
    const { agent_id, agent_input, metadata } = context.propsValue;
    const { apiKey, organization_id } = context.auth.props;

    const payload: any = {
      organization_id,
    };
    if (agent_input) {
      payload.agent_input = agent_input;
    }
    if (metadata) {
      payload.metadata = metadata;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.roe-ai.com/v1/agents/run/${agent_id}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: payload,
    });

    return response.body;
  },
});
