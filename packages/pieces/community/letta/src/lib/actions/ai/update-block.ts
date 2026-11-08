import { createAction, Property } from '@activepieces/pieces-framework';
import { lettaAuth } from '../../common/auth';
import { lettaApi } from '../../common/client';
import { lettaProps } from '../../common/props';
import { lettaSchemas } from '../../common/schemas';
import type { BlockUpdateParams } from '../../common/types';

export const lettaUpdateBlock = createAction({
  auth: lettaAuth,
  name: 'letta_update_block',
  displayName: 'Update Block',
  description: 'Updates a shared memory block.',
  classification: 'WRITE',
  audience: 'ai',
  outputSchema: lettaSchemas.block,
  aiMetadata: {
    description:
      'Updates a Letta memory block by ID; only filled fields are sent. Value replaces the whole text. Changes are visible to every agent the block is attached to. Idempotent: the same update gives the same block.',
    idempotent: true,
  },
  props: {
    block_id: lettaProps.aiId({ displayName: 'Block ID', description: 'The block ID (block-...). Get it from List Blocks.' }),
    label: Property.ShortText({ displayName: 'Label', description: 'New label.', required: false }),
    value: Property.LongText({ displayName: 'Value', description: 'New full text. Replaces the current value.', required: false }),
    description: Property.ShortText({ displayName: 'Description', description: 'New description.', required: false }),
    limit: Property.Number({ displayName: 'Character Limit', description: 'New maximum characters.', required: false }),
  },
  async run({ auth, propsValue }) {
    const client = await lettaApi.getLettaClient({ auth: auth.props });
    const blockId = lettaApi.requireText({ value: propsValue.block_id, name: 'Block ID' });
    const body: BlockUpdateParams = {
      label: lettaApi.optionalText(propsValue.label),
      value: propsValue.value === undefined || propsValue.value === null || propsValue.value === '' ? undefined : propsValue.value,
      description: lettaApi.optionalText(propsValue.description),
      limit: propsValue.limit === undefined || propsValue.limit === null ? undefined : lettaApi.resolveLimit({ limit: propsValue.limit, max: 1000000, fallback: 1 }),
    };
    if (Object.values(body).every((value) => value === undefined)) {
      throw new Error('Provide at least one field to update.');
    }
    const block = await lettaApi.callLetta(() => client.blocks.update(blockId, body));
    return lettaApi.mapBlock(block);
  },
});
