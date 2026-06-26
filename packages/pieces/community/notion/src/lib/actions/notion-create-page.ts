import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { markdownToBlocks } from '@tryfabric/martian';
import { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';

import { notionAuth } from '../auth';
import { getNotionToken } from '../common';

export const notionCreatePage = createAction({
  auth: notionAuth,
  name: 'notion_create_page',
  displayName: 'Create Page',
  description:
    'Creates a new sub-page under an existing Notion page, with a title and optional markdown body.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new sub-page under an existing Notion page, with a title and optional markdown body. Use to add a free-form document page; to add a row to a database use notion_create_database_item instead. Resolve parent_page_id via notion_search. Each call creates a new page even with the same title.',
    idempotent: false,
  },
  props: {
    parent_page_id: Property.ShortText({
      displayName: 'Parent Page ID',
      description:
        'The id of the existing page to create the new page under. Resolve via notion_search.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the new page.',
      required: false,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description:
        'Optional body content for the page. Markdown is supported and converted to Notion blocks.',
      required: false,
    }),
  },
  async run(context) {
    const { parent_page_id, title, content } = context.propsValue;

    const notion = new Client({
      auth: getNotionToken(context.auth),
      notionVersion: '2022-02-22',
    });

    const pageProperties: any = {
      title: {
        title: [
          {
            text: {
              content: title ?? '',
            },
          },
        ],
      },
    };

    const children = content
      ? (markdownToBlocks(content) as unknown as BlockObjectRequest[])
      : [];

    try {
      const page = await notion.pages.create({
        parent: {
          page_id: parent_page_id as string,
        },
        properties: pageProperties,
        children,
      });
      return page;
    } catch (error: any) {
      if (
        error.message?.includes('permissions') ||
        error.code === 'unauthorized'
      ) {
        throw new Error(
          'Integration lacks required capabilities or the parent page is not shared with it. Ensure your Notion integration has "Insert content" capability enabled and the parent page is shared with it.'
        );
      }
      throw error;
    }
  },
});
