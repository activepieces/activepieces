import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { makeClient } from '../../../common';
import { deleteDocBlockActionOutputSchema } from '../../../output-schemas';

export const deleteDocBlockAction = createAction({
  auth: mondayAuth,
  name: 'monday_delete_doc_block',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Doc Block',
  description: 'Deletes a block from a monday doc.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Delete one block from a monday.com doc by block ID; the rest of the doc is untouched. Resolve the block ID with Get Doc Blocks. Not idempotent: a retry on an already-deleted block errors.',
    idempotent: false,
  },
  outputSchema: deleteDocBlockActionOutputSchema,
  props: {
    block_id: Property.ShortText({
      displayName: 'Block ID',
      description: 'The block to delete. Resolve it with Get Doc Blocks.',
      required: true,
    }),
  },
  async run(context) {
    const { block_id } = context.propsValue;

    const data = await makeClient(context.auth).query<{ delete_doc_block: { id: string } | null }>({
      query: `mutation ($blockId: String!) {
        delete_doc_block(block_id: $blockId) {
          id
        }
      }`,
      variables: { blockId: block_id },
    });

    return {
      id: data.delete_doc_block?.id ?? block_id,
      deleted: true,
    };
  },
});
