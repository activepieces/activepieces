import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cursorAuth, CursorAuth } from './auth';
import { makeCursorRequest } from './client';

interface Agent {
  id: string;
  name: string;
  status: string;
  source?: {
    repository?: string;
    ref?: string;
  };
  target?: {
    branchName?: string;
    url?: string;
    prUrl?: string;
  };
  summary?: string;
  createdAt: string;
}

interface ListAgentsResponse {
  agents: Agent[];
  nextCursor?: string;
}

export const agentDropdown = Property.Dropdown({
  auth: cursorAuth,
  displayName: 'Agent',
  description: 'Select a cloud agent',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Cursor account first',
        options: [],
      };
    }

    try {
      const response = await makeCursorRequest<ListAgentsResponse>(
        auth as CursorAuth,
        '/v0/agents',
        HttpMethod.GET,
        undefined,
        { limit: 100 }
      );

      if (!response.agents || response.agents.length === 0) {
        return {
          options: [],
          placeholder: 'No agents found',
        };
      }

      return {
        options: response.agents.map((agent) => ({
          label: `${agent.name} (${agent.status})`,
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

