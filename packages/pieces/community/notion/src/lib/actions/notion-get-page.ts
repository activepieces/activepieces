import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../auth';
import { getNotionToken } from '../common';

export const notionGetPage = createAction({
  auth: notionAuth,
  name: 'notion_get_page',
  displayName: 'Get Page',
  description:
    "Fetches a single page's metadata and property values by id (a database row is a page).",
  audience: 'ai',
  aiMetadata: {
    description:
      "Fetches a single page's metadata and property values by id (a database row is a page — use this for either). Use when you have a page id (from notion_search) and need its current properties; to read the body blocks use notion_get_block_children. Read-only and safe to retry.",
    idempotent: true,
  },
  props: {
    page_id: Property.ShortText({
      displayName: 'Page ID',
      description:
        'The id of the page (or database row) to retrieve. Resolve via notion_search.',
      required: true,
    }),
  },
  async run(context) {
    const { page_id } = context.propsValue;

    if (!page_id) {
      throw new Error('Page ID is required');
    }

    const notion = new Client({
      auth: getNotionToken(context.auth),
      notionVersion: '2022-02-22',
    });

    try {
      return await notion.pages.retrieve({ page_id: page_id as string });
    } catch (error: any) {
      if (error.code === 'object_not_found' || error.code === 'unauthorized') {
        throw new Error(
          'Page not found or not shared with the integration. Ensure the page exists and is shared with your Notion integration.'
        );
      }
      throw error;
    }
  },
});
