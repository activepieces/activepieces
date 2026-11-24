import { createAction } from '@activepieces/pieces-framework';
import { lettaAuth } from '../../common/auth';
import { lettaApi } from '../../common/client';
import { lettaProps } from '../../common/props';
import { lettaSchemas } from '../../common/schemas';

export const lettaGetAgentBlock = createAction({
  auth: lettaAuth,
  name: 'letta_get_agent_block',
  displayName: 'Get Agent Memory Block',
  description: 'Gets one core memory block of an agent by label.',
  classification: 'READ',
  audience: 'ai',
  outputSchema: lettaSchemas.block,
  aiMetadata: {
    description:
      'Retrieves one core memory block of a Letta agent by its label (for example human or persona). Read-only.',
    idempotent: true,
  },
  props: {
    agent_id: lettaProps.aiId({ displayName: 'Agent ID', description: 'The agent ID (agent-...). Get it from List Agents.' }),
    block_label: lettaProps.aiId({ displayName: 'Block Label', description: 'The memory block label, such as human or persona. Get labels from List Agent Memory Blocks.' }),
  },
  async run({ auth, propsValue }) {
    const client = await lettaApi.getLettaClient({ auth: auth.props });
    const agentId = lettaApi.requireText({ value: propsValue.agent_id, name: 'Agent ID' });
    const label = lettaApi.requireText({ value: propsValue.block_label, name: 'Block Label' });
    const block = await lettaApi.callLetta(() => client.agents.blocks.retrieve(label, { agent_id: agentId }));
    return lettaApi.mapBlock(block);
  },
});
