import {
  createAction,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../..';
import { notionCommon } from '../common';

export const restoreDatabaseItem = createAction({
  auth: notionAuth,
  name: 'restore_database_item',
  displayName: 'Restore Database Item',
  description:
    'Restore an archived database item back to active status. Perfect for recovering accidentally archived tasks, projects, or records.',
  props: {
    database_id: notionCommon.database_id,
    archived_item_id: notionCommon.archived_database_item_id,
  },
  async run(context) {
    const { database_id, archived_item_id } = context.propsValue;

    if (!database_id) {
      throw new Error('Database selection is required');
    }

    if (!archived_item_id) {
      throw new Error('Please select an archived item to restore');
    }

    const notion = new Client({
      auth: (context.auth as OAuth2PropertyValue).access_token,
      notionVersion: '2022-02-22',
    });

    try {
      const response = await notion.pages.update({
        page_id: archived_item_id,
        archived: false,
      });

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
          'Unable to restore item: Your Notion integration may lack edit permissions for this database. Please check your integration permissions in Notion.'
        );
      }

      if (error.message?.includes('not_found')) {
        throw new Error(
          'The selected item could not be found. It may have been permanently deleted or moved to a different database.'
        );
      }

      throw new Error(`Failed to restore database item: ${error.message}`);
    }
  },
});
