import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../auth';
import { getNotionToken } from '../common';

export const notionArchivePage = createAction({
  auth: notionAuth,
  name: 'notion_archive_page',
  displayName: 'Archive or Restore Page',
  description:
    'Archives (trashes) or restores any page or database row by id via its archived flag.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Archives (trashes) or restores any page or database row by id via its archived flag — set archived=true to trash, false to restore. Use for the generic "move this page to trash" verb on a raw page id; for database items selected from a dropdown use the human Archive/Restore Database Item actions. Safe to retry — re-applying the same state is a no-op.',
    idempotent: true,
  },
  props: {
    page_id: Property.ShortText({
      displayName: 'Page ID',
      description:
        'The id of the page (or database row) to archive or restore. Resolve via notion_search.',
      required: true,
    }),
    archived: Property.Checkbox({
      displayName: 'Archived',
      description:
        'Set to true to archive (trash) the page, false to restore it.',
      required: true,
    }),
  },
  async run(context) {
    const { page_id, archived } = context.propsValue;

    if (!page_id) {
      throw new Error('Page ID is required');
    }

    const notion = new Client({
      auth: getNotionToken(context.auth),
      notionVersion: '2022-02-22',
    });

    try {
      return await notion.pages.update({
        page_id: page_id as string,
        archived,
      });
    } catch (error: any) {
      if (
        error.message?.includes('permissions') ||
        error.code === 'unauthorized'
      ) {
        throw new Error(
          'Integration lacks required capabilities or the page is not shared with it. Ensure your Notion integration has "Update content" capability and the page is shared with it.'
        );
      }
      if (error.code === 'object_not_found') {
        throw new Error(
          'Page not found. It may have been deleted or is not shared with the integration.'
        );
      }
      throw error;
    }
  },
});
