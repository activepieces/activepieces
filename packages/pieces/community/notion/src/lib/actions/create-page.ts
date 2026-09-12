import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';

import { notionAuth } from '../auth';
import { getNotionToken, notionCommon } from '../common';
import { createPageActionOutputSchema } from '../output-schemas';

export const createPage = createAction({
  auth: notionAuth,
  name: 'createPage',
  classification: 'WRITE',
  displayName: 'Create Page',
  description:
    'Create a page inside another page, with a title and plain text.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a new standalone page nested under an existing parent page, with a title and optional body content. Use when an agent must add free-form document pages (notes, docs) rather than database rows; requires the parent page id. Not idempotent: each call creates a new page even with identical title.',
    idempotent: false,
  },
  props: {
    pageId: {
      ...notionCommon.page,
      displayName: 'Parent Page',
      description: 'The new page is created inside this page.',
    },
    title: Property.ShortText({
      displayName: 'Title',
      placeholder: 'e.g. Meeting notes',
      required: false,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'Plain text body. Markdown is not rendered.',
      required: false,
    }),
  },
  outputSchema: createPageActionOutputSchema,

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
