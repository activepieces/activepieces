import {
  createAction,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../..';
import { notionCommon } from '../common';

export const retrieveDatabase = createAction({
  auth: notionAuth,
  name: 'retrieve_database',
  displayName: 'Retrieve Database',
  description: 'Build dynamic forms based on DB structure.',
  props: {
    database_id: notionCommon.database_id,
  },
  async run(context) {
    const { database_id } = context.propsValue;

    if (!database_id) {
      throw new Error('Database ID is required');
    }

    const notion = new Client({
      auth: (context.auth as OAuth2PropertyValue).access_token,
      notionVersion: '2022-02-22',
    });

    const database = await notion.databases.retrieve({
      database_id: database_id,
    });

    const formStructure: any = {
      id: database.id,
      title: (database as any).title,
      description: (database as any).description,
      properties: {},
      propertyTypes: {},
      requiredFields: [],
      selectOptions: {},
    };

    Object.entries(database.properties).forEach(([key, property]: [string, any]) => {
      formStructure.properties[key] = {
        name: property.name || key,
        type: property.type,
        id: property.id,
      };

      formStructure.propertyTypes[key] = property.type;

      if (property.type === 'select' && property.select?.options) {
        formStructure.selectOptions[key] = property.select.options.map((option: any) => ({
          name: option.name,
          color: option.color,
          id: option.id,
        }));
      } else if (property.type === 'multi_select' && property.multi_select?.options) {
        formStructure.selectOptions[key] = property.multi_select.options.map((option: any) => ({
          name: option.name,
          color: option.color,
          id: option.id,
        }));
      }
    });

    return {
      success: true,
      database: database,
      formStructure: formStructure,
      message: 'Database structure retrieved successfully',
    };
  },
});
