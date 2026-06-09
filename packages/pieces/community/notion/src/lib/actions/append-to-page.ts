import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';

import { notionAuth } from '../auth';
import { getNotionToken, notionCommon } from '../common';
import { markdownToBlocks } from '@tryfabric/martian';
import { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';

export const appendToPage = createAction({
  auth: notionAuth,
  name: 'append_to_page',
  displayName: 'Append to Page',
  description: 'Appends content to the end of a page.',
  audience: 'both',
  aiMetadata: {
    description:
      'Appends new block content (parsed from markdown) to the end of an existing Notion page or block. Use when an agent must add to a page without altering existing content; requires the target page/block id. Not idempotent: each call appends again, duplicating the content on repeat.',
    idempotent: false,
  },
  props: {
    pageId: notionCommon.page,
    content: Property.LongText({
      displayName: 'Content',
      description:
        'The content you want to append. You can use markdown formatting.',
      required: true,
    }),
  },
  async run(context) {
    const { pageId, content } = context.propsValue;

    const notion = new Client({
      auth: getNotionToken(context.auth),
      notionVersion: '2022-02-22',
    });

    return await notion.blocks.children.append({
      block_id: pageId as string,
      children: markdownToBlocks(content) as unknown as BlockObjectRequest[],
    });
  },
});
