import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../auth';
import { getNotionToken } from '../common';

export const notionCreateDatabase = createAction({
  auth: notionAuth,
  name: 'notion_create_database',
  displayName: 'Create Database',
  description:
    'Creates a new inline Notion database under a parent page, with a title and a property-schema object defining its columns.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new inline database under a parent PAGE (not a database), with a title and a property-schema object defining its columns. Use to set up a new structured table; resolve parent_page_id via notion_search. Exactly one property must be of the title type. Not idempotent — each call creates a distinct database.',
    idempotent: false,
  },
  props: {
    parent_page_id: Property.ShortText({
      displayName: 'Parent Page ID',
      description:
        'The id of the PAGE the new database will live under (must be a page, not a database). Resolve it via notion_search.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the new database.',
      required: true,
    }),
    properties: Property.Json({
      displayName: 'Properties (Schema)',
      description:
        'A Notion property-schema object: a map of column name to a type-config object. Example: { "Name": { "title": {} }, "Status": { "select": { "options": [ { "name": "Open" }, { "name": "Done" } ] } }, "Estimate": { "number": { "format": "number" } } }. EXACTLY ONE property must be of type "title". Common types: title:{}, rich_text:{}, number:{format}, select:{options:[{name,color?}]}, multi_select:{options:[...]}, date:{}, checkbox:{}, url:{}, email:{}, phone_number:{}, people:{}, relation:{database_id}.',
      required: true,
    }),
  },
  async run(context) {
    const { parent_page_id, title, properties } = context.propsValue;

    if (!parent_page_id) {
      throw new Error('Parent Page ID is required');
    }
    if (
      properties === undefined ||
      properties === null ||
      typeof properties !== 'object' ||
      Array.isArray(properties)
    ) {
      throw new Error(
        'Properties must be a Notion property-schema JSON object (a map of column name to a type-config object, with exactly one "title" property).'
      );
    }

    const notion = new Client({
      auth: getNotionToken(context.auth),
      notionVersion: '2022-02-22',
    });

    try {
      const response = await notion.databases.create({
        parent: {
          type: 'page_id',
          page_id: parent_page_id,
        },
        title: [
          {
            type: 'text',
            text: { content: title },
          },
        ],
        properties: properties as any,
      });

      return {
        success: true,
        database: response,
      };
    } catch (error: any) {
      if (
        error.code === 'validation_error' ||
        error.message?.includes('validation_error') ||
        error.status === 400
      ) {
        throw new Error(
          `Notion rejected the schema (validation error): ${error.message}. Ensure exactly one property is of type "title", that the parent is a page (not a database), and that each property's type-config is valid.`
        );
      }
      if (
        error.message?.includes('permissions') ||
        error.message?.includes('unauthorized') ||
        error.code === 'unauthorized'
      ) {
        throw new Error(
          'Unable to create database: the integration may lack "insert content" capability, or the parent page is not shared with the integration.'
        );
      }
      if (
        error.message?.includes('not_found') ||
        error.code === 'object_not_found'
      ) {
        throw new Error(
          'Parent page not found. Check the parent_page_id (it must be a page, not a database), or share the page with the integration.'
        );
      }
      throw new Error(`Failed to create database: ${error.message}`);
    }
  },
});
