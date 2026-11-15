import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayApi } from '../../../common/monday-api';
import { makeClient } from '../../../common';
import { updateDocBlockActionOutputSchema } from '../../../output-schemas';

export const updateDocBlockAction = createAction({
  auth: mondayAuth,
  name: 'monday_update_doc_block',
  classification: 'WRITE',
  displayName: 'Update Doc Block',
  description: 'Replaces the content of a block in a monday doc.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Replace the JSON content of one existing monday.com doc block by block ID (e.g. {"deltaFormat":[{"insert":"new text"}]}). The block type cannot change and table dimensions cannot be edited. Read the current content first with Get Doc Blocks when you only want to change part of it. Safe to retry: the same content converges on the same block.',
    idempotent: true,
  },
  outputSchema: updateDocBlockActionOutputSchema,
  props: {
    block_id: Property.ShortText({
      displayName: 'Block ID',
      description: 'The block to update. Resolve it with Get Doc Blocks.',
      required: true,
    }),
    content: Property.Json({
      displayName: 'Content',
      description: 'The full new block content JSON.',
      required: true,
    }),
  },
  async run(context) {
    const { block_id, content } = context.propsValue;

    const data = await makeClient(context.auth).query<{ update_doc_block: DocBlock | null }>({
      query: `mutation ($blockId: String!, $content: JSON!) {
        update_doc_block(block_id: $blockId, content: $content) {
          id
          type
          position
          parent_block_id
          content
        }
      }`,
      variables: {
        blockId: block_id,
        content: mondayApi.toJsonString(content),
      },
    });

    const block = data.update_doc_block;
    if (!block) {
      throw new Error(`Block ${block_id} was not found or could not be updated.`);
    }

    return {
      id: block.id,
      type: block.type ?? null,
      position: block.position ?? null,
      parent_block_id: block.parent_block_id ?? null,
      content: mondayApi.toJsonString(block.content ?? null),
    };
  },
});

type DocBlock = {
  id: string;
  type: string | null;
  position: number | null;
  parent_block_id: string | null;
  content: unknown;
};
