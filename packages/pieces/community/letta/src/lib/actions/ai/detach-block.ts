import { createAction } from '@activepieces/pieces-framework';
import { lettaAuth } from '../../common/auth';
import { lettaApi } from '../../common/client';
import { lettaProps } from '../../common/props';
import { lettaSchemas } from '../../common/schemas';

export const lettaDetachBlock = createAction({
  auth: lettaAuth,
  name: 'letta_detach_block',
  displayName: 'Detach Memory Block',
  description: 'Detaches a memory block from an agent.',
  classification: 'WRITE',
  audience: 'ai',
  outputSchema: lettaSchemas.detachBlock,
  aiMetadata: {
    description:
      'Detaches a memory block from a Letta agent; the block itself is kept and can be attached again. Returns the agent\'s remaining block list. Idempotent: detaching a block that is not attached succeeds with already_detached true.',
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
    try {
      const agent = await lettaApi.callLetta(() => client.agents.blocks.detach(blockId, { agent_id: agentId }));
      return toOutput({ agentId, blockId, blocks: agent.blocks ?? [], alreadyDetached: false });
    } catch (error) {
      if (!isNotAttached(error)) {
        throw error;
      }
      const agent = await lettaApi.callLetta(() => client.agents.retrieve(agentId, { include: ['agent.blocks'] }));
      return toOutput({ agentId, blockId, blocks: agent.blocks ?? [], alreadyDetached: true });
    }
  },
});

function isNotAttached(error: unknown): boolean {
  return (
    lettaApi.isLettaApiError(error) &&
    error.status === 404 &&
    JSON.stringify(error.responseBody ?? '').includes('is not attached')
  );
}

function toOutput({ agentId, blockId, blocks, alreadyDetached }: {
  agentId: string;
  blockId: string;
  blocks: Array<{ id?: string | null; label?: string | null }>;
  alreadyDetached: boolean;
}) {
  return {
    agent_id: agentId,
    block_id: blockId,
    detached: true,
    already_detached: alreadyDetached,
    blocks: blocks.map((block) => ({ id: block.id ?? null, label: block.label ?? null })),
  };
}
