import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiApiCall } from '../common/client';
import { retellAiAuth } from '../common/auth';
import { agentIdDropdown } from '../common/props';

export const getAgent = createAction({
  auth: retellAiAuth,
  name: 'get_agent',
  displayName: 'Get Agent',
  description: 'Fetch details of a Retell AI agent by Agent ID.',
  props: {
    agentId: agentIdDropdown('Agent ID',true),
    version: Property.Number({
      displayName: 'Version',
      description: 'Optional version of the API to use for this request. If not provided, will default to latest version.',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const { agentId, version } = propsValue;

    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    let url = `/get-agent/${encodeURIComponent(agentId)}`;
 
    if (version !== undefined) {
      url += `?version=${version}`;
    }

    return await retellAiApiCall({
      method: HttpMethod.GET,
      url: url,
      auth: auth,
    });
  },
});