import { createAction, Property } from '@activepieces/pieces-framework';
import { lettaAuth } from '../../common/auth';
import { lettaApi } from '../../common/client';
import { lettaProps } from '../../common/props';
import { lettaSchemas } from '../../common/schemas';

export const lettaUpdateAgentBlock = createAction({
  auth: lettaAuth,
  name: 'letta_update_agent_block',
  displayName: 'Update Agent Memory Block',
  description: 'Rewrites an agent\'s core memory block.',
  classification: 'WRITE',
  audience: 'ai',
  outputSchema: lettaSchemas.block,
  aiMetadata: {
    description:
      'Updates one core memory block of a Letta agent by label. Value replaces the whole block text (it is not appended), so read the block first if you want to keep existing content. Only filled fields are sent. Idempotent: the same update gives the same block.',
    idempotent: true,
  },
  props: {
    agent_id: lettaProps.aiId({ displayName: 'Agent ID', description: 'The agent ID (agent-...). Get it from List Agents.' }),
    block_label: lettaProps.aiId({ displayName: 'Block Label', description: 'The memory block label, such as human or persona. Get labels from List Agent Memory Blocks.' }),
    value: Property.LongText({ displayName: 'Value', description: 'New full text of the block. Replaces the current value.', required: false }),
    description: Property.ShortText({ displayName: 'Description', description: 'New block description.', required: false }),
    limit: Property.Number({ displayName: 'Character Limit', description: 'New maximum characters for the block.', required: false }),
  },
  async run({ auth, propsValue }) {
    const client = await lettaApi.getLettaClient({ auth: auth.props });
    const agentId = lettaApi.requireText({ value: propsValue.agent_id, name: 'Agent ID' });
    const label = lettaApi.requireText({ value: propsValue.block_label, name: 'Block Label' });
    const value = propsValue.value === undefined || propsValue.value === null || propsValue.value === '' ? undefined : propsValue.value;
    const description = lettaApi.optionalText(propsValue.description);
    const limit = propsValue.limit === undefined || propsValue.limit === null ? undefined : lettaApi.resolveLimit({ limit: propsValue.limit, max: 1000000, fallback: 1 });
    if (value === undefined && description === undefined && limit === undefined) {
      throw new Error('Provide a value, description or character limit to update.');
    }
    const block = await lettaApi.callLetta(() =>
      client.agents.blocks.update(label, { agent_id: agentId, value, description, limit })
    );
    return lettaApi.mapBlock(block);
  },
});
