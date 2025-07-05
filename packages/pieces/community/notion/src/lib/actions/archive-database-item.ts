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
  description: 'Soft-delete (archive) a database item.',
  props: {
    database_id: notionCommon.database_id,
    database_item_id: notionCommon.database_item_id,
  },
  async run(context) {
    const { database_item_id } = context.propsValue;

    if (!database_item_id) {
      throw new Error('Database item ID is required');
    }

    const notion = new Client({
      auth: (context.auth as OAuth2PropertyValue).access_token,
      notionVersion: '2022-02-22',
    });

    const response = await notion.pages.update({
      page_id: database_item_id,
      archived: true,
    });

    return {
      success: true,
      message: 'Database item archived successfully',
      archivedItem: response,
    };
  },
});
