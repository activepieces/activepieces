import { createAction, Property } from '@activepieces/pieces-framework';
import { NotionToMarkdown } from 'notion-to-md';
import { notionAuth } from '../auth';
import { getNotionToken } from '../common';
import { Client, collectPaginatedAPI, isFullBlock } from '@notionhq/client';
import { PartialBlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export const notionGetBlockChildren = createAction({
  auth: notionAuth,
  name: 'notion_get_block_children',
  displayName: 'Get Page or Block Content',
  description:
    'Reads the body content of a page or block by recursively listing its child blocks, optionally rendered as markdown.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads the body content of a page or block by recursively listing its child blocks, optionally rendered as markdown. Use to read what is actually written inside a page (text, nested blocks) rather than its metadata. The block_id is a page id or parent-block id (from notion_search / notion_get_page). Read-only.',
    idempotent: true,
  },
  props: {
    block_id: Property.ShortText({
      displayName: 'Page or Block ID',
      description:
        'The id of the page or parent block whose content to read. Resolve via notion_search (page) or this action (child block ids).',
      required: true,
    }),
    markdown: Property.Checkbox({
      displayName: 'Markdown',
      description:
        'When enabled, return the content rendered as a markdown string. When disabled, return the raw Notion block JSON tree.',
      required: true,
      defaultValue: false,
    }),
    depth: Property.Number({
      displayName: 'Depth',
      description:
        'Recursively retrieve nested children up to this depth. Only used when Markdown is disabled. Defaults to 1.',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const { block_id, markdown, depth } = context.propsValue;

    const notion = new Client({
      auth: getNotionToken(context.auth),
      notionVersion: '2022-02-22',
    });

    if (markdown) {
      const n2m = new NotionToMarkdown({
        notionClient: notion,
        config: { parseChildPages: false },
      });
      return n2m.toMarkdownString(await n2m.pageToMarkdown(block_id as string))
        .parent;
    }

    return getBlockChildrenRecursively(
      notion,
      block_id as string,
      depth ?? 1,
      0
    );
  },
});

async function getBlockChildrenRecursively(
  notion: Client,
  blockId: string,
  depth: number,
  currentDepth = 0
) {
  if (currentDepth >= depth) {
    return [];
  }

  const children = await collectPaginatedAPI(notion.blocks.children.list, {
    block_id: blockId,
  });

  for (const child of children) {
    if (!isFullBlock(child) || !child.has_children) {
      continue;
    }
    const childChildren = await getBlockChildrenRecursively(
      notion,
      child.id,
      depth,
      currentDepth + 1
    );
    (child as BlockObjectResponseWithChildren).children = childChildren;
  }

  return children;
}

type BlockObjectResponseWithChildren = PartialBlockObjectResponse & {
  children?: BlockObjectResponseWithChildren[];
};
