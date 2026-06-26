import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { markdownToBlocks } from '@tryfabric/martian';
import { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';

import { notionAuth } from '../auth';
import { getNotionToken } from '../common';

export const notionAppendToPage = createAction({
  auth: notionAuth,
  name: 'notion_append_to_page',
  displayName: 'Append Content to Page',
  description:
    'Appends new block content (parsed from markdown) to the end of a page or block.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Appends new block content (parsed from markdown) to the end of a page or block. Use to add to a page without altering existing content; to replace a specific block's text use notion_update_block. Each call appends again, so retries duplicate the content. Notion caps each text block at 2000 chars.",
    idempotent: false,
  },
  props: {
    block_id: Property.ShortText({
      displayName: 'Page or Block ID',
      description:
        'The id of the page or block to append content to. Resolve via notion_search (page) or notion_get_block_children (block).',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description:
        'The content to append. Markdown formatting is supported. Each resulting text block is capped at 2000 characters by Notion.',
      required: true,
    }),
  },
  async run(context) {
    const { block_id, content } = context.propsValue;

    const notion = new Client({
      auth: getNotionToken(context.auth),
      notionVersion: '2022-02-22',
    });

    try {
      return await notion.blocks.children.append({
        block_id: block_id as string,
        children: markdownToBlocks(content) as unknown as BlockObjectRequest[],
      });
    } catch (error: any) {
      if (
        error.message?.includes('permissions') ||
        error.code === 'unauthorized'
      ) {
        throw new Error(
          'Integration lacks required capabilities or the target is not shared with it. Ensure your Notion integration has "Insert content" capability enabled and the page is shared with it.'
        );
      }
      throw error;
    }
  },
});
