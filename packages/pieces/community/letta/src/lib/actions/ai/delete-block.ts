import { createAction } from '@activepieces/pieces-framework';
import { lettaAuth } from '../../common/auth';
import { lettaApi } from '../../common/client';
import { lettaProps } from '../../common/props';
import { lettaSchemas } from '../../common/schemas';

export const lettaDeleteBlock = createAction({
  auth: lettaAuth,
  name: 'letta_delete_block',
  displayName: 'Delete Block',
  description: 'Permanently deletes a memory block.',
  classification: 'DESTRUCTIVE',
  audience: 'ai',
  outputSchema: lettaSchemas.deletedBlock,
  aiMetadata: {
    description:
      'Permanently deletes a Letta memory block; it is removed from every agent it was attached to. Cannot be undone. Not idempotent: a second delete returns not found.',
    idempotent: false,
  },
  props: {
    block_id: lettaProps.aiId({ displayName: 'Block ID', description: 'The block ID (block-...). Get it from List Blocks.' }),
  },
  async run({ auth, propsValue }) {
    const client = await lettaApi.getLettaClient({ auth: auth.props });
    const blockId = lettaApi.requireText({ value: propsValue.block_id, name: 'Block ID' });
    await lettaApi.callLetta(() => client.blocks.delete(blockId));
    return { block_id: blockId, deleted: true };
  },
});
