import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../auth';
import { getNotionToken } from '../common';

export const notionRestoreDatabaseItem = createAction({
  auth: notionAuth,
  name: 'notion_restore_database_item',
  displayName: 'Restore Database Item',
  description:
    'Restores an archived Notion database item back to active status by its page id.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Un-archives a previously archived database row, returning it to active status. Use to recover a record archived via notion_archive_database_item; supply the archived row's page id. Safe to retry — restoring an already-active item is a no-op.",
    idempotent: true,
  },
  props: {
    item_id: Property.ShortText({
      displayName: 'Item ID',
      description:
        'The page id of the archived database row to restore. Resolve it via notion_query_database (with an archived filter) or from the response of notion_archive_database_item.',
      required: true,
    }),
  },
  async run(context) {
    const { item_id } = context.propsValue;

    if (!item_id) {
      throw new Error('Item ID is required');
    }

    const notion = new Client({
      auth: getNotionToken(context.auth),
      notionVersion: '2022-02-22',
    });

    try {
      const response = await notion.pages.update({
        page_id: item_id,
        archived: false,
      });

      let itemTitle = 'Database item';
      let itemUrl = undefined;

      if ('properties' in response && response.properties) {
        const firstProperty = Object.values(response.properties)[0];
        if (
          firstProperty &&
          typeof firstProperty === 'object' &&
          'title' in firstProperty &&
          firstProperty.title
        ) {
          itemTitle =
            (firstProperty.title as any)[0]?.plain_text || 'Untitled item';
        }
      }

      if ('url' in response) {
        itemUrl = response.url;
      }

      return {
        success: true,
        message: `"${itemTitle}" has been successfully restored and is now active`,
        restoredItem: {
          id: response.id,
          title: itemTitle,
          url: itemUrl,
          restored_at: new Date().toISOString(),
        },
        fullResponse: response,
      };
    } catch (error: any) {
      if (
        error.message?.includes('permissions') ||
        error.message?.includes('unauthorized')
      ) {
        throw new Error(
          'Unable to restore item: Your Notion integration may lack edit permissions for this database. Please check your integration permissions in Notion and make sure the page is shared with the integration.'
        );
      }

      if (error.message?.includes('not_found')) {
        throw new Error(
          'The item could not be found. It may have been permanently deleted, or the page is not shared with the integration.'
        );
      }

      throw new Error(`Failed to restore database item: ${error.message}`);
    }
  },
});
