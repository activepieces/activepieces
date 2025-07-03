import { notionAuth } from '../../';
import { createAction } from '@activepieces/pieces-framework';
import { notionCommon } from '../common';
import { Client } from '@notionhq/client';

export const findDatabaseItem = createAction({
  auth: notionAuth,
  name: 'notion-find-database-item',
  displayName: 'Find Database Item',
  description: 'Searches for an item in database by field.',
  props: {
    database_id: notionCommon.database_id,
    filterDatabaseFields: notionCommon.filterDatabaseFields,
  },
  async run(context) {
    const databaseId = context.propsValue.database_id;
    const filterFields = context.propsValue.filterDatabaseFields;

    const notion = new Client({
      auth: context.auth.access_token,
      notionVersion: '2022-02-22',
    });

    const { properties } = await notion.databases.retrieve({
      database_id: databaseId as string,
    });

    const filterArray = [];

    for (const fieldKey in filterFields) {
      const fieldValue = filterFields[fieldKey];
      const fieldType = properties[fieldKey].type;
      if (fieldValue === '' || fieldValue === undefined) {
        continue;
      }
      switch (fieldType) {
        case 'number':
          filterArray.push({
            property: fieldKey,
            number: { equals: Number(fieldValue) },
          });
          break;
        case 'rich_text':
          filterArray.push({
            property: fieldKey,
            rich_text: { equals: fieldValue },
          });
          break;
        case 'email':
          filterArray.push({
            property: fieldKey,
            email: { equals: fieldValue },
          });
          break;
        case 'select':
          filterArray.push({
            property: fieldKey,
            select: { equals: fieldValue },
          });
          break;
        case 'phone_number':
          filterArray.push({
            property: fieldKey,
            phone_number: { equals: fieldValue },
          });
          break;
        case 'url':
          filterArray.push({ property: fieldKey, url: { equals: fieldValue } });
          break;
        case 'title':
          filterArray.push({
            property: fieldKey,
            title: { equals: fieldValue },
          });
          break;
      }
    }

    const { results } = await notion.databases.query({
      database_id: databaseId as string,
      filter: {
        and: filterArray,
      },
    });

    return {
      success: results.length > 0,
      results,
    };
  },
});
