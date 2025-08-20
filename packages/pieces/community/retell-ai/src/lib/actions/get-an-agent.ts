import { createAction, Property } from '@activepieces/pieces-framework';
import { RetllAiAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getAnAgent = createAction({
  auth: RetllAiAuth,
  name: 'getAnAgent',
  displayName: 'Get an Agent',
  description: 'Fetch details of a Retell AI agent by Agent ID',
  props: {
    agentId: Property.ShortText({
      displayName: 'Agent ID',
      description: 'The unique identifier of the agent to retrieve',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await makeRequest(
      auth as string,
      HttpMethod.GET,
      `/get-agent/${propsValue.agentId}`,
      undefined
    );

    return response;
  },
});