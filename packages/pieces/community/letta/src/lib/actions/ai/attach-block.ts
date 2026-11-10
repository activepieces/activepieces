import { createAction } from '@activepieces/pieces-framework';
import { lettaAuth } from '../../common/auth';
import { lettaApi } from '../../common/client';
import { lettaProps } from '../../common/props';
import { lettaSchemas } from '../../common/schemas';

export const lettaAttachBlock = createAction({
  auth: lettaAuth,
  name: 'letta_attach_block',
  displayName: 'Attach Memory Block',
  description: 'Attaches a memory block to an agent.',
  classification: 'WRITE',
  audience: 'ai',
  outputSchema: lettaSchemas.agentBlockLink,
  aiMetadata: {
    description:
      'Attaches an existing shared memory block to a Letta agent\'s core memory so the agent can read and edit it. Returns the agent\'s resulting block list. Idempotent in intent: attaching an already attached block leaves the same set.',
    idempotent: true,
  },
  props: {
    agent_id: lettaProps.aiId({ displayName: 'Agent ID', description: 'The agent ID (agent-...). Get it from List Agents.' }),
    block_id: lettaProps.aiId({ displayName: 'Block ID', description: 'The block ID (block-...). Get it from List Blocks.' }),
  },
  async run({ auth, propsValue }) {
    const client = await lettaApi.getLettaClient({ auth: auth.props });
    const agentId = lettaApi.requireText({ value: propsValue.agent_id, name: 'Agent ID' });
    const blockId = lettaApi.requireText({ value: propsValue.block_id, name: 'Block ID' });
    const agent = await lettaApi.callLetta(() => client.agents.blocks.attach(blockId, { agent_id: agentId }));
    return {
      agent_id: agentId,
      block_id: blockId,
      blocks: (agent.blocks ?? []).map((block) => ({ id: block.id ?? null, label: block.label ?? null })),
    };
  },
});
