import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bolnaaiAuth } from '../common/auth';
import { bolnaClient } from '../common/client';
import { bolnaSchemas } from '../common/schemas';

export const listAgents = createAction({
  auth: bolnaaiAuth,
  name: 'list_agents',
  displayName: 'List Agents',
  description: 'List the voice AI agents in the Bolna account.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: {
    fields: [
      {
        key: 'agents',
        label: 'Agents',
        labelKey: 'agent_name',
        listItems: [
          { key: 'id', label: 'Agent ID' },
          { key: 'agent_name', label: 'Agent Name' },
          { key: 'agent_type', label: 'Agent Type' },
          { key: 'agent_status', label: 'Agent Status' },
          { key: 'created_at', label: 'Created At', format: 'datetime' },
          { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  aiMetadata: {
    description:
      'Lists every Bolna voice agent in the account with its ID, name, type and status (prompts are omitted to keep the result small). Use it to find the agent ID needed by Make Phone Call, Get Agent, List Agent Executions or List Batches.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await bolnaClient.makeRequest<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/v2/agent/all',
    });
    const agents = bolnaSchemas
      .asArray(response)
      .map((agent) =>
        bolnaSchemas.pick({
          source: agent,
          keys: [
            'id',
            'agent_name',
            'agent_type',
            'agent_status',
            'created_at',
            'updated_at',
          ],
        })
      );
    return { agents, count: agents.length };
  },
});
