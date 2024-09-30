import {
  createAction,
  DynamicPropsValue,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { NotionToMarkdown } from 'notion-to-md';
import { notionAuth } from '../..';
import { Client, collectPaginatedAPI, isFullBlock } from '@notionhq/client';
import { PartialBlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export const getPageOrBlockChildren = createAction({
  auth: notionAuth,
  name: 'getPageOrBlockChildren',
  displayName: 'Get block content',
  description: 'Retrieve the actual content of a page (represented by blocks).',
  props: {
    parentId: Property.ShortText({
      displayName: 'Page or parent block ID',
      required: true,
    }),
    markdown: Property.Checkbox({
      displayName: 'Markdown',
      description: 'Convert Notion JSON blocks to Markdown',
      required: true,
      defaultValue: false,
    }),
    dynamic: Property.DynamicProperties({
      displayName: 'Dynamic properties',
      refreshers: ['markdown'],
      required: true,
      props: async ({ markdown }) => {
        if (markdown) {
          return {};
        }
        const fields: DynamicPropsValue = {
          depth: Property.Number({
            displayName: 'Depth',
            description: 'Recursively retrieve children up to this depth',
            required: true,
            defaultValue: 1,
          }),
        };
        return fields;
      },
    }),
  },
  async run(context) {
    const notion = new Client({
      auth: (context.auth as OAuth2PropertyValue).access_token,
      notionVersion: '2022-02-22',
    });

    if (context.propsValue.markdown) {
      const n2m = new NotionToMarkdown({
        notionClient: notion,
        config: { parseChildPages: false },
      });
      return n2m.toMarkdownString(
        await n2m.pageToMarkdown(context.propsValue.parentId)
      ).parent;
    } else {
      return getBlockChildrenRecursively(
        notion,
        context.propsValue.parentId,
        context.propsValue.dynamic['depth'],
        0
      );
    }
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

  // Retrieve the block's children
  const children = await collectPaginatedAPI(notion.blocks.children.list, {
    block_id: blockId,
  });

  // Recursively retrieve children of each child block
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
