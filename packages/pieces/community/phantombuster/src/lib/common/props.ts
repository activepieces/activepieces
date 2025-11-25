import { Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const agentIdDropdown = Property.Dropdown({
  displayName: 'Agent',
  description: 'Select the Phantombuster agent to use',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    const response = await makeRequest(
      auth as string,
      HttpMethod.GET,
      'agents/fetch-all'
    );

    return {
      options: response.map((agent: any) => ({
        label: agent.name + ' ' + agent.createdAt,
        value: agent.id,
      })),
    };
  },
});
