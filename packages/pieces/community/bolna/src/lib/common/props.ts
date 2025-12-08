import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { bolnaaiAuth } from './auth';

export const agentId = Property.Dropdown({
  displayName: 'Agent',
  description: 'Select the Bolna Voice AI agent',
  required: true,
  refreshers: [],
  auth: bolnaaiAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
      };
    }
    try {
      const response = await makeRequest(
        auth.secret_text,
        HttpMethod.GET,
        '/agent/all'
      );

      return {
        disabled: false,
        options: response.map((agent: any) => ({
          label: agent.agent_name,
          value: agent.id,
        })),
      };
    } catch (e) {
      return {
        disabled: true,
        options: [],
      };
    }
  },
});
