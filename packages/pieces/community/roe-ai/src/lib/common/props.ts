import { Property } from '@activepieces/pieces-framework';
import { roeAiAuth } from './auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const agentIdDropdown = Property.Dropdown({
  auth: roeAiAuth,
  displayName: 'Agent',
  description: 'Select Agent ',
  refreshers: [],
  required: true,
  options: async (propsValue) => {
    const apiKey = propsValue.auth?.props.apiKey;
    const organization_id = propsValue.auth?.props.organization_id;
    if (!apiKey) {
      return {
        disabled: true,
        options: [],
      };
    }

    const agents: Array<{ id: string; name: string }> = [];
    let nextUrl:
      | string
      | null = `https://api.roe-ai.com/v1/agents?organization_id=${organization_id}`;

    while (nextUrl) {
      const response = (await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: nextUrl,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })) as any;

      const pageAgents = response.body.results as Array<{
        id: string;
        name: string;
      }>;
      agents.push(...pageAgents);
      nextUrl = response.body.next || null;
    }

    return {
      disabled: false,
      options: agents.map((agent) => ({
        label: agent.name,
        value: agent.id,
      })),
    };
  },
});
