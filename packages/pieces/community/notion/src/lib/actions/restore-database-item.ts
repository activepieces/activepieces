import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../..';
import { notionCommon } from '../common';

export const restoreDatabaseItem = createAction({
  auth: notionAuth,
  name: 'restore_database_item',
  displayName: 'Restore Database Item',
  description: 'Recover accidentally archived tasks.',
  props: {
    database_id: notionCommon.database_id,
    database_item_id: Property.ShortText({
      displayName: 'Archived Item ID',
      description: 'The ID of the archived database item to restore',
      required: true,
    }),
  },
  async run(context) {
    const { database_item_id } = context.propsValue;

    if (!database_item_id) {
      throw new Error('Archived item ID is required');
    }

    const notion = new Client({
      auth: (context.auth as OAuth2PropertyValue).access_token,
      notionVersion: '2022-02-22',
    });
    try {
      const response = await notion.pages.update({
        page_id: database_item_id,
        archived: false,
      });

      return {
        success: true,
        message: 'Database item restored successfully',
        restoredItem: response,
      };
    } catch (error: any) {
      if (
        error.message?.includes('capabilities') ||
        error.message?.includes('permission')
      ) {
        throw new Error(
          'Integration lacks required comment capabilities. Please ensure your Notion integration has "Insert comments" capability enabled.'
        );
      }
      throw error;
    }
  },
});
