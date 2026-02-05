import {
  createAction,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../..';
import { notionCommon } from '../common';
import {
  FormStructure,
  NotionDatabase,
  NotionDatabaseProperty,
} from '../common/types';

export const retrieveDatabase = createAction({
  auth: notionAuth,
  name: 'retrieve_database',
  displayName: 'Retrieve Database Structure',
  description:
    'Get detailed information about a Notion database including all its properties, field types, and configuration. Perfect for building dynamic forms, validation rules, or understanding database schemas.',
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

    const database = (await notion.databases.retrieve({
      database_id: database_id,
    })) as NotionDatabase;

    const formStructure: FormStructure = {
      id: database.id,
      title: database.title?.[0]?.plain_text || '',
      description: database.description?.[0]?.plain_text || '',
      properties: {},
      propertyTypes: {},
      requiredFields: [],
      selectOptions: {},
      statusOptions: {},
      relationConfig: {},
      formulaConfig: {},
      rollupConfig: {},
      numberConfig: {},
    };

    Object.entries(database.properties).forEach(
      ([key, property]: [string, NotionDatabaseProperty]) => {
        formStructure.properties[key] = {
          name: property.name || key,
          type: property.type,
          id: property.id,
          description: property.description || '',
        };

        formStructure.propertyTypes[key] = property.type;

        switch (property.type) {
          case 'select':
            if (property.select?.options) {
              formStructure.selectOptions[key] = property.select.options.map(
                (option: { name: string; color: string; id: string }) => ({
                  name: option.name,
                  color: option.color,
                  id: option.id,
                })
              );
            }
            break;

          case 'multi_select':
            if (property.multi_select?.options) {
              formStructure.selectOptions[key] =
                property.multi_select.options.map(
                  (option: { name: string; color: string; id: string }) => ({
                    name: option.name,
                    color: option.color,
                    id: option.id,
                  })
                );
            }
            break;

          case 'status':
            if (property.status) {
              formStructure.statusOptions[key] = {
                options:
                  property.status.options?.map(
                    (option: { name: string; color: string; id: string }) => ({
                      name: option.name,
                      color: option.color,
                      id: option.id,
                    })
                  ) || [],
                groups:
                  property.status.groups?.map(
                    (group: {
                      name: string;
                      color: string;
                      id: string;
                      option_ids: string[];
                    }) => ({
                      name: group.name,
                      color: group.color,
                      id: group.id,
                      option_ids: group.option_ids || [],
                    })
                  ) || [],
              };
            }
            break;

          case 'relation':
            if (property.relation) {
              formStructure.relationConfig[key] = {
                database_id: property.relation.database_id,
                synced_property_id: property.relation.synced_property_id,
                synced_property_name: property.relation.synced_property_name,
              };
            }
            break;

          case 'formula':
            if (property.formula) {
              formStructure.formulaConfig[key] = {
                expression: property.formula.expression,
              };
            }
            break;

          case 'rollup':
            if (property.rollup) {
              formStructure.rollupConfig[key] = {
                function: property.rollup.function,
                relation_property_id: property.rollup.relation_property_id,
                relation_property_name: property.rollup.relation_property_name,
                rollup_property_id: property.rollup.rollup_property_id,
                rollup_property_name: property.rollup.rollup_property_name,
              };
            }
            break;

          case 'number':
            if (property.number) {
              formStructure.numberConfig[key] = {
                format: property.number.format,
              };
            }
            break;

          case 'checkbox':
          case 'created_by':
          case 'created_time':
          case 'date':
          case 'email':
          case 'files':
          case 'last_edited_by':
          case 'last_edited_time':
          case 'people':
          case 'phone_number':
          case 'rich_text':
          case 'title':
          case 'url':
            break;

          default:
            console.warn(
              `Unknown property type: ${property.type} for property: ${key}`
            );
            break;
        }
      }
    );

    const totalProperties = Object.keys(formStructure.properties).length;

    return {
      success: true,
      database: database,
      formStructure: formStructure,
      summary: {
        title: formStructure.title || 'Untitled Database',
        totalProperties: totalProperties,
        propertyTypes: Object.values(formStructure.propertyTypes).reduce(
          (acc: Record<string, number>, type) => {
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          },
          {}
        ),
      },
      message: `📊 Database structure retrieved successfully! Found ${totalProperties} properties including ${
        Object.keys(formStructure.selectOptions).length
      } dropdown fields and ${
        Object.keys(formStructure.statusOptions).length
      } status fields.`,
    };
  },
});
