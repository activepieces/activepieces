import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../auth';
import { getNotionToken } from '../common';

export const notionArchiveDatabaseItem = createAction({
  auth: notionAuth,
  name: 'notion_archive_database_item',
  displayName: 'Archive Database Item',
  description:
    'Archives (soft-deletes) a Notion database item by its page id, keeping it recoverable.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Soft-deletes a database row by setting its archived flag, keeping it recoverable via notion_restore_database_item. Use to remove a record from active views without permanent deletion; resolve the row's page id via notion_query_database or notion_find_database_item. Safe to retry — re-archiving an already-archived item is a no-op.",
    idempotent: true,
  },
  props: {
    item_id: Property.ShortText({
      displayName: 'Item ID',
      description:
        'The page id of the database row to archive. Resolve it via notion_query_database or notion_find_database_item.',
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
        archived: true,
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
        message: `"${itemTitle}" has been archived successfully`,
        archivedItem: {
          id: response.id,
          title: itemTitle,
          url: itemUrl,
          archived_at: new Date().toISOString(),
        },
        fullResponse: response,
      };
    } catch (error: any) {
      if (
        error.message?.includes('permissions') ||
        error.message?.includes('unauthorized')
      ) {
        throw new Error(
          'Unable to archive item: Your Notion integration may lack edit permissions for this database. Please check your integration permissions in Notion and make sure the page is shared with the integration.'
        );
      }

      if (error.message?.includes('not_found')) {
        throw new Error(
          'The item could not be found. It may have been deleted, or the page is not shared with the integration.'
        );
      }

      throw new Error(`Failed to archive database item: ${error.message}`);
    }
  },
});
