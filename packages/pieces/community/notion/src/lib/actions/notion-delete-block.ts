import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../auth';
import { getNotionToken } from '../common';

export const notionDeleteBlock = createAction({
  auth: notionAuth,
  name: 'notion_delete_block',
  displayName: 'Delete Block',
  description:
    'Deletes (archives) a single block by id, removing it from its page.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes (archives) a single block by id, removing it from its page (recoverable from Notion trash). Use to remove one block resolved via notion_get_block_children; to trash a whole page use notion_archive_page. A repeat call on an already-deleted block 404s.',
    idempotent: false,
  },
  props: {
    block_id: Property.ShortText({
      displayName: 'Block ID',
      description:
        'The id of the block to delete. Resolve via notion_get_block_children.',
      required: true,
    }),
  },
  async run(context) {
    const { block_id } = context.propsValue;

    if (!block_id) {
      throw new Error('Block ID is required');
    }

    const notion = new Client({
      auth: getNotionToken(context.auth),
      notionVersion: '2022-02-22',
    });

    try {
      return await notion.blocks.delete({ block_id: block_id as string });
    } catch (error: any) {
      if (
        error.message?.includes('permissions') ||
        error.code === 'unauthorized'
      ) {
        throw new Error(
          'Integration lacks required capabilities or the block is not shared with it. Ensure your Notion integration has "Update content" capability and the parent page is shared with it.'
        );
      }
      if (error.code === 'object_not_found') {
        throw new Error(
          'Block not found. It may already be deleted, or is not shared with the integration.'
        );
      }
      throw error;
    }
  },
});
