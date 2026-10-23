import { createAction, Property } from '@activepieces/pieces-framework';

import { agentxAuth } from '../../auth';
import { agentxApi } from '../../common/api';

export const listAgentsAction = createAction({
  auth: agentxAuth,
  name: 'agentx_list_agents',
  displayName: 'List Agents',
  description:
    'Lists the AgentX agents on the account, optionally filtered by name or ID.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the AgentX agents this API key can access, optionally narrowed to names containing a text (case-insensitive) or to one exact agent ID. Use it to find the agent ID that List Conversations and Create Conversation need.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name Contains',
      description:
        'Only return agents whose name contains this text (case-insensitive).',
      required: false,
    }),
    agentId: Property.ShortText({
      displayName: 'Agent ID',
      description: 'Only return the agent with this exact ID.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { name, agentId } = propsValue;
    const all = await agentxApi.listAgents({ auth });
    const agents = all.filter(
      (agent) =>
        (!agentId || agent._id === agentId || agent.id === agentId) &&
        (!name || (agent.name ?? '').toLowerCase().includes(name.toLowerCase()))
    );
    return { agents, count: agents.length };
  },
});
