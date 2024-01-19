import {
  createAction,
  DynamicPropsValue,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { NotionFieldMapping } from '../common/models';

import { notionAuth } from '../..';
import { notionCommon } from '../common';
export const updateDatabaseItem = createAction({
  auth: notionAuth,
  name: 'update_database_item',
  displayName: 'Update Database Item',
  description: 'Updates an item in database',
  props: {
    database_id: notionCommon.database_id,
    database_item_id: notionCommon.database_item_id,
    databaseFields: notionCommon.databaseFields,
  },
  async run(context) {
    const { database_id, database_item_id, databaseFields } =
      context.propsValue;

    if (!database_item_id) throw new Error('Item ID is required');

    const notionFields: DynamicPropsValue = {};

    const notion = new Client({
      auth: (context.auth as OAuth2PropertyValue).access_token,
      notionVersion: '2022-02-22',
    });
    const { properties } = await notion.databases.retrieve({
      database_id: database_id as unknown as string,
    });

    Object.keys(databaseFields).forEach((key) => {
      if (databaseFields[key] !== '') {
        const fieldType: string = properties[key].type;
        notionFields[key] = NotionFieldMapping[fieldType].buildNotionType(
          databaseFields[key]
        );
      }
    });
    return await notion.pages.update({
      page_id: database_item_id,
      properties: notionFields,
    });
  },
});
