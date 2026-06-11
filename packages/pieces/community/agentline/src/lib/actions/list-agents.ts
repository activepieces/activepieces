import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { agentlineAuth } from '../..';
import { agentlineApiCall } from '../common';

export const listAgents = createAction({
  auth: agentlineAuth,
  name: 'list_agents',
  displayName: 'List Agents',
  description: 'List all AI voice agents on your account',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists all Agentline voice agents on the authenticated account. Returns agent IDs, names, prompts, and voice settings.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await agentlineApiCall(
      context.auth.secret_text,
      HttpMethod.GET,
      '/v1/agents',
    );
    return response.body;
  },
});
