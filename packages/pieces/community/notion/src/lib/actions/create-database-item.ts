import {
  createAction,
  DynamicPropsValue,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { NotionFieldMapping } from '../common/models';
import { notionAuth } from '../..';
import { notionCommon } from '../common';

export const createDatabaseItem = createAction({
  auth: notionAuth,
  name: 'create_database_item',
  displayName: 'Create Database Item',
  description:
    'Add a new item to a Notion database with custom field values and optional content. Ideal for creating tasks, records, or entries in structured databases.',
  props: {
    database_id: notionCommon.database_id,
    databaseFields: notionCommon.databaseFields,
    content: Property.LongText({
      displayName: 'Content',
      description: 'The content you want to append to your item.',
      required: false,
    }),
  },
  async run(context) {
    const database_id = context.propsValue.database_id!;
    const databaseFields = context.propsValue.databaseFields!;
    const content = context.propsValue.content;
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
        const fieldType: string = properties[key]?.type;
        if (fieldType) {
          notionFields[key] = NotionFieldMapping[fieldType].buildNotionType(
            databaseFields[key]
          );
        }
      }
    });

    const children: any[] = [];
    // Add content to page
    if (content)
      children.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: content,
              },
            },
          ],
        },
      });

    return await notion.pages.create({
      parent: {
        type: 'database_id',
        database_id: database_id,
      },
      properties: notionFields,
      children: children,
    });
  },
});
