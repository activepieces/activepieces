import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../auth';
import { getNotionToken } from '../common';

export const notionUpdateDatabaseItem = createAction({
  auth: notionAuth,
  name: 'notion_update_database_item',
  displayName: 'Update Database Item',
  description:
    'Overwrites property values on an existing Notion database row, identified by its page id, from a raw Notion properties object.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Overwrites property fields on an existing database row identified by its page id. Supply the changed values as a raw Notion properties object (only the properties you include are changed); call notion_get_database to learn names/types. Resolve the row's page id via notion_query_database or notion_find_database_item. Safe to retry — re-applying the same values converges.",
    idempotent: true,
  },
  props: {
    item_id: Property.ShortText({
      displayName: 'Item ID',
      description:
        'The page id of the database row to update. Resolve it via notion_query_database or notion_find_database_item.',
      required: true,
    }),
    properties: Property.Json({
      displayName: 'Properties',
      description:
        'A Notion properties object with the values to set: a map of property name to a typed value object. Only the properties you include are changed; others are left untouched. Example: { "Status": { "status": { "name": "Done" } }, "Estimate": { "number": 5 } }. Run notion_get_database first to confirm property names and types.',
      required: true,
    }),
  },
  async run(context) {
    const { item_id, properties } = context.propsValue;

    if (!item_id) {
      throw new Error('Item ID is required');
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

    try {
      const response = await notion.pages.update({
        page_id: item_id,
        properties: properties as any,
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
          `Notion rejected the update (validation error): ${error.message}. Check that property names and value shapes match the database schema — run notion_get_database to confirm.`
        );
      }
      if (
        error.message?.includes('permissions') ||
        error.message?.includes('unauthorized') ||
        error.code === 'unauthorized'
      ) {
        throw new Error(
          'Unable to update item: the integration may lack "update content" capability, or the page is not shared with the integration.'
        );
      }
      if (
        error.message?.includes('not_found') ||
        error.code === 'object_not_found'
      ) {
        throw new Error(
          'Item not found. Check the item_id, or share the page with the integration.'
        );
      }
      throw new Error(`Failed to update database item: ${error.message}`);
    }
  },
});
