import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { bolnaClient } from './client';
import { bolnaaiAuth } from './auth';
import { bolnaSchemas } from './schemas';

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
        placeholder: 'Please connect your Bolna AI account first',
      };
    }
    try {
      const response = await bolnaClient.makeRequest<unknown>({
        apiKey: auth.secret_text,
        method: HttpMethod.GET,
        path: '/v2/agent/all',
      });
      const agents = bolnaSchemas.asArray(response);
      return {
        disabled: false,
        options: agents.map((agent) => ({
          label: String(agent['agent_name'] ?? agent['id']),
          value: String(agent['id']),
        })),
        placeholder: agents.length === 0 ? 'No agents found in this account' : undefined,
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: error instanceof Error ? error.message : 'Failed to load agents',
      };
    }
  },
});
