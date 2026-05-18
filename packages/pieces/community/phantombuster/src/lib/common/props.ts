import { Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';
import { phantombusterAuth } from './auth';

export const agentIdDropdown = Property.Dropdown({
  auth: phantombusterAuth,
  displayName: 'Agent',
  description: 'Select the Phantombuster agent to use',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please configure the authentication first',
      };
    }
    const response = await makeRequest(
      auth,
      HttpMethod.GET,
      '/agents/fetch-all'
    );

    return {
      disabled: false,
      options: response.map((agent: any) => ({
        label: agent.name + ' ' + agent.createdAt,
        value: agent.id,
      })),
    };
  },
});
