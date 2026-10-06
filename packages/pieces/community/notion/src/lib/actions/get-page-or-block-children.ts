import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { NotionToMarkdown } from 'notion-to-md';
import { notionAuth } from '../auth';
import { getNotionToken } from '../common';
import { Client, collectPaginatedAPI, isFullBlock } from '@notionhq/client';
import { PartialBlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { getPageOrBlockChildrenActionOutputSchema } from '../output-schemas';

export const getPageOrBlockChildren = createAction({
  auth: notionAuth,
  name: 'getPageOrBlockChildren',
  classification: 'READ',
  displayName: 'Get Block Content',
  description: "Read a page's content as blocks or as Markdown.",
  audience: 'human',
  aiMetadata: {
    description:
      'Reads the body content of a Notion page or block by recursively listing its child blocks, optionally rendered as markdown. Use when an agent needs to read what is actually written inside a page (text, nested blocks) rather than its metadata; requires the page or parent block id. Idempotent read-only fetch.',
    idempotent: true,
  },
  props: {
    parentId: Property.ShortText({
      displayName: 'Page or Block ID',
      description: 'Paste the ID, or map a page from a previous step.',
      required: true,
      placeholder: 'e.g. 1d4805e9774b8056820bc1083bff77e3',
    }),
    markdown: Property.Checkbox({
      displayName: 'Markdown',
      description: 'Return the content as Markdown instead of blocks.',
      required: false,
      defaultValue: false,
    }),
    dynamic: Property.DynamicProperties({
      auth: notionAuth,
      displayName: 'Dynamic Properties',
      refreshers: ['markdown'],
      required: true,
      props: async ({ markdown }) => {
        if (markdown) {
          return {};
        }
        const fields: DynamicPropsValue = {
          depth: Property.Number({
            displayName: 'Depth',
            description: 'How many levels of nested blocks to include.',
            required: true,
            defaultValue: 1,
          }),
        };
        return fields;
      },
    }),
  },
  outputSchema: getPageOrBlockChildrenActionOutputSchema,
  async run(context) {
    const notion = new Client({
      auth: getNotionToken(context.auth),
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
