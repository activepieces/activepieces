import { createAction } from '@activepieces/pieces-framework';
import { lettaAuth } from '../../common/auth';
import { lettaApi } from '../../common/client';
import { lettaProps } from '../../common/props';
import { lettaSchemas } from '../../common/schemas';

export const lettaGetAgent = createAction({
  auth: lettaAuth,
  name: 'letta_get_agent',
  displayName: 'Get Agent',
  description: 'Gets an agent with its memory blocks and tools.',
  classification: 'READ',
  audience: 'ai',
  outputSchema: lettaSchemas.agent,
  aiMetadata: {
    description:
      'Retrieves one Letta agent by ID, including its system prompt, model, core memory blocks (label, value, limit), attached tools and identity IDs. Use before editing an agent or its memory. Read-only.',
    idempotent: true,
  },
  props: {
    agent_id: lettaProps.aiId({ displayName: 'Agent ID', description: 'The agent ID (agent-...). Get it from List Agents.' }),
  },
  async run({ auth, propsValue }) {
    const client = await lettaApi.getLettaClient({ auth: auth.props });
    const agentId = lettaApi.requireText({ value: propsValue.agent_id, name: 'Agent ID' });
    const agent = await lettaApi.callLetta(() =>
      client.agents.retrieve(agentId, { include: ['agent.blocks', 'agent.tools', 'agent.tags'] })
    );
    return lettaApi.mapAgent(agent);
  },
});
