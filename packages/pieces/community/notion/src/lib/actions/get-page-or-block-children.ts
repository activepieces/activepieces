import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
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
    depth: Property.Number({
      displayName: 'Depth',
      description: 'Recursively retrieve children up to this depth',
      required: true,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const notion = new Client({
      auth: (context.auth as OAuth2PropertyValue).access_token,
      notionVersion: '2022-02-22',
    });

    return getBlockChildrenRecursively(
      notion,
      context.propsValue.parentId,
      context.propsValue.depth,
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
