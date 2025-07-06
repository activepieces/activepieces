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

    // Validate database ID format (Notion IDs are 32 characters)
    if (!/^[a-zA-Z0-9]{32}$/.test(database_id)) {
      throw new Error(
        'Invalid database ID format. Notion IDs should be 32 characters long.'
      );
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
      statusOptions: {},
      rollupConfigs: {},
      formulaConfigs: {},
      relationConfigs: {},
    };

    // Validate that database has properties
    if (!database.properties || typeof database.properties !== 'object') {
      throw new Error(
        'Database has no properties or invalid property structure'
      );
    }

    // Check for required title property
    const hasTitleProperty = Object.values(database.properties).some(
      (prop: any) => prop.type === 'title'
    );
    if (!hasTitleProperty) {
      throw new Error(
        'Database must have a title property. This is required by Notion.'
      );
    }

    Object.entries(database.properties).forEach(
      ([key, property]: [string, any]) => {
        // Validate property structure
        if (!property || typeof property !== 'object') {
          console.warn(`Skipping invalid property: ${key}`);
          return;
        }

        if (!property.type || !property.id || !property.name) {
          console.warn(
            `Skipping property with missing required fields: ${key}`
          );
          return;
        }

        formStructure.properties[key] = {
          name: property.name,
          type: property.type,
          id: property.id,
          description: property.description || null,
        };

        formStructure.propertyTypes[key] = property.type;

        // Handle different property types based on Notion API documentation
        switch (property.type) {
          case 'select':
            if (property.select?.options) {
              formStructure.selectOptions[key] = property.select.options.map(
                (option: any) => ({
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
                property.multi_select.options.map((option: any) => ({
                  name: option.name,
                  color: option.color,
                  id: option.id,
                }));
            }
            break;

          case 'status':
            if (property.status) {
              formStructure.statusOptions[key] = {
                options:
                  property.status.options?.map((option: any) => ({
                    name: option.name,
                    color: option.color,
                    id: option.id,
                  })) || [],
                groups:
                  property.status.groups?.map((group: any) => ({
                    name: group.name,
                    color: group.color,
                    id: group.id,
                    option_ids: group.option_ids || [],
                  })) || [],
              };
            }
            break;

          case 'rollup':
            if (property.rollup) {
              formStructure.rollupConfigs[key] = {
                rollup_property_name: property.rollup.rollup_property_name,
                relation_property_name: property.rollup.relation_property_name,
                rollup_property_id: property.rollup.rollup_property_id,
                relation_property_id: property.rollup.relation_property_id,
                function: property.rollup.function,
              };
            }
            break;

          case 'formula':
            if (property.formula) {
              formStructure.formulaConfigs[key] = {
                expression: property.formula.expression,
              };
            }
            break;

          case 'relation':
            if (property.relation) {
              formStructure.relationConfigs[key] = {
                database_id: property.relation.database_id,
                type: property.relation.type,
                single_property: property.relation.single_property,
                dual_property: property.relation.dual_property,
              };
            }
            break;

          default:
            console.warn(
              `Unknown property type: ${property.type} for property: ${key}`
            );
            break;
        }
      }
    );

    return {
      success: true,
      database: database,
      formStructure: formStructure,
      message: 'Database structure retrieved successfully',
    };
  },
});
