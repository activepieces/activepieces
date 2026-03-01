import { Property } from '@activepieces/pieces-framework';
import { customgptAuth } from './auth';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const projectId = Property.Dropdown({
  auth: customgptAuth,
  displayName: 'Agent',
  description: 'Select the agent to use',
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Cursor account first',
        options: [],
      };
    }

    try {
      const response = await makeRequest(
        auth.secret_text,
        HttpMethod.GET,
        '/projects'
      );

      if (!response.data || response.data.data.length === 0) {
        return {
          options: [],
          placeholder: 'No agents found',
        };
      }

      return {
        options: response.data.data.map((agent: any) => ({
          label: `${agent.project_name} (${agent.status})`,
          value: agent.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load agents. Check your API key.',
      };
    }
  },
});
