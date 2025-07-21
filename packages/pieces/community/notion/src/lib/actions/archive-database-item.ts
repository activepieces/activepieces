import {
  createAction,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../..';
import { notionCommon } from '../common';

export const archiveDatabaseItem = createAction({
  auth: notionAuth,
  name: 'archive_database_item',
  displayName: 'Archive Database Item',
  description:
    'Archive (soft-delete) a database item without permanently removing it. Archived items can be restored later if needed.',
  props: {
    database_id: notionCommon.database_id,
    database_item_id: notionCommon.database_item_id,
  },
  async run(context) {
    const { database_id, database_item_id } = context.propsValue;

    if (!database_id) {
      throw new Error('Database selection is required');
    }

    if (!database_item_id) {
      throw new Error('Please select a database item to archive');
    }

    const notion = new Client({
      auth: (context.auth as OAuth2PropertyValue).access_token,
      notionVersion: '2022-02-22',
    });

    try {
      const response = await notion.pages.update({
        page_id: database_item_id,
        archived: true,
      });

      // Get the item title for better user feedback
      let itemTitle = 'Database item';
      let itemUrl = undefined;

      if ('properties' in response && response.properties) {
        const firstProperty = Object.values(response.properties)[0];
        if (firstProperty && 'title' in firstProperty && firstProperty.title) {
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
        // Include full response for advanced users
        fullResponse: response,
      };
    } catch (error: any) {
      if (
        error.message?.includes('permissions') ||
        error.message?.includes('unauthorized')
      ) {
        throw new Error(
          'Unable to archive item: Your Notion integration may lack edit permissions for this database. Please check your integration permissions in Notion.'
        );
      }

      if (error.message?.includes('not_found')) {
        throw new Error(
          'The selected item could not be found. It may have been deleted or moved to a different database.'
        );
      }

      // Re-throw with more context
      throw new Error(`Failed to archive database item: ${error.message}`);
    }
  },
});
