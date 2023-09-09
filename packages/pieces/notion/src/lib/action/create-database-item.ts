import {
  createAction,
  DynamicPropsValue,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { NotionFieldMapping } from '../common/models';

import { notionAuth } from '../..';
import { notionCommon } from '../common';
export const createDatabaseItem = createAction({
  auth: notionAuth,
  name: 'create_database_item',
  displayName: 'Create Database Item',
  description: 'Creates an item in database',
  props: {
    database_id: notionCommon.database_id,
    databaseFields: notionCommon.databaseFields,
  },
  async run(context) {
    const database_id = context.propsValue.database_id!;
    const databaseFields = context.propsValue.databaseFields!;
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
    return await notion.pages.create({
      parent: {
        type: 'database_id',
        database_id: database_id,
      },
      properties: notionFields,
    });
  },
});
