import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../auth';
import { getNotionToken } from '../common';

export const notionCreateDatabaseItem = createAction({
  auth: notionAuth,
  name: 'notion_create_database_item',
  displayName: 'Create Database Item',
  description:
    'Creates a new row (page) in a Notion database, setting its property values from a raw Notion properties object, with optional body content.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new row (page) in a database. Supply property values as a raw Notion properties object (the same shape the API expects); call notion_get_database FIRST to learn the property names and types. Resolve database_id via notion_search. Not idempotent — each call creates a separate row, so guard against duplicates.',
    idempotent: false,
  },
  props: {
    database_id: Property.ShortText({
      displayName: 'Database ID',
      description:
        'The id of the database to add a row to. Resolve a database title into its id with notion_search (filter_type=database).',
      required: true,
    }),
    properties: Property.Json({
      displayName: 'Properties',
      description:
        'A Notion properties object: a map of property name to a typed value object matching the database schema. Example: { "Name": { "title": [ { "text": { "content": "My task" } } ] }, "Status": { "status": { "name": "In Progress" } }, "Estimate": { "number": 3 }, "Tags": { "multi_select": [ { "name": "urgent" } ] }, "Due": { "date": { "start": "2026-07-01" } } }. Run notion_get_database first to confirm property names and types.',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description:
        'Optional plain-text paragraph to append as the body of the new row (page).',
      required: false,
    }),
  },
  async run(context) {
    const { database_id, properties, content } = context.propsValue;

    if (!database_id) {
      throw new Error('Database ID is required');
    }
    if (
      properties === undefined ||
      properties === null ||
      typeof properties !== 'object' ||
      Array.isArray(properties)
    ) {
      throw new Error(
        'Properties must be a Notion properties JSON object (a map of property name to a typed value object). Run notion_get_database to learn the schema.'
      );
    }

    const notion = new Client({
      auth: getNotionToken(context.auth),
      notionVersion: '2022-02-22',
    });

    const children: any[] = [];
    if (content) {
      children.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: { content: content },
            },
          ],
        },
      });
    }

    try {
      const response = await notion.pages.create({
        parent: {
          type: 'database_id',
          database_id: database_id,
        },
        properties: properties as any,
        children: children,
      });
      return {
        success: true,
        item: response,
      };
    } catch (error: any) {
      if (
        error.code === 'validation_error' ||
        error.message?.includes('validation_error') ||
        error.status === 400
      ) {
        throw new Error(
          `Notion rejected the new item (validation error): ${error.message}. Check that property names and value shapes match the database schema — run notion_get_database to confirm.`
        );
      }
      if (
        error.message?.includes('permissions') ||
        error.message?.includes('unauthorized') ||
        error.code === 'unauthorized'
      ) {
        throw new Error(
          'Unable to create item: the integration may lack "insert content" capability, or the database is not shared with the integration.'
        );
      }
      if (
        error.message?.includes('not_found') ||
        error.code === 'object_not_found'
      ) {
        throw new Error(
          'Database not found. Check the database_id, or share the database with the integration.'
        );
      }
      throw new Error(`Failed to create database item: ${error.message}`);
    }
  },
});
