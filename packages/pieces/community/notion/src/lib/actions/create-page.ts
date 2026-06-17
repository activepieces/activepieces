import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';

import { notionAuth } from '../auth';
import { getNotionToken, notionCommon } from '../common';

export const createPage = createAction({
  auth: notionAuth,
  name: 'createPage',
  displayName: 'Create Page',
  description:
    'Create a new Notion page as a sub-page with custom title and content. Perfect for organizing documentation, notes, or creating structured page hierarchies.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new standalone page nested under an existing parent page, with a title and optional body content. Use when an agent must add free-form document pages (notes, docs) rather than database rows; requires the parent page id. Not idempotent: each call creates a new page even with identical title.',
    idempotent: false,
  },
  props: {
    pageId: notionCommon.page,
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the page.',
      required: false,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'The content of the page.',
      required: false,
    }),
  },

  async run(context) {
    const { pageId, title, content } = context.propsValue;

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

    const children: any[] = [];
    // Add content to page
    if (content)
      children.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: content,
              },
            },
          ],
        },
      });

    const page = await notion.pages.create({
      parent: {
        page_id: pageId as string,
      },
      properties: pageProperties,
      children: children,
    });
    return page;
  },
});
