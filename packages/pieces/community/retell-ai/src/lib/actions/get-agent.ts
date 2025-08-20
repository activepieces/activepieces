import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, QueryParams } from '@activepieces/pieces-common';

import { retellAiAuth } from '../..';
import { retellAiCommon } from '../common';

export const getAgentAction = createAction({
  auth: retellAiAuth,
  name: 'get_agent',
  displayName: 'Get an Agent',
  description: 'Fetch details of a Retell AI agent by Agent ID.',
  props: {
    agent_id: Property.ShortText({
      displayName: 'Agent ID',
      description: 'The unique identifier of the agent to retrieve.',
      required: true,
    }),
    version: Property.Number({
        displayName: 'Version',
        description: 'Optional version of the agent to retrieve. Defaults to the latest version if not provided.',
        required: false,
    })
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { agent_id, version } = propsValue;

    const queryParams: QueryParams = {};
    if (version) {
        queryParams['version'] = version.toString();
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${retellAiCommon.baseUrl}/get-agent/${agent_id}`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
      queryParams: queryParams,
    });

    return response.body;
  },
});
