import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../auth';
import { getNotionToken } from '../common';

export const notionUpdateDatabaseSchema = createAction({
  auth: notionAuth,
  name: 'notion_update_database_schema',
  displayName: 'Update Database Schema',
  description:
    "Updates a Notion database's title and/or column schema (add, rename, retype, or remove properties) by id.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Updates a database's title or column schema (add/rename/retype/remove properties) by id. Use to edit a database's STRUCTURE; to add a ROW use notion_create_database_item instead. Resolve database_id via notion_search. WARNING: removing or renaming a column is destructive to its existing row data. Safe to retry — re-applying the same schema converges.",
    idempotent: true,
  },
  props: {
    database_id: Property.ShortText({
      displayName: 'Database ID',
      description:
        'The id of the database whose schema to update. Resolve it via notion_search (filter_type=database).',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Optional. A new title for the database.',
      required: false,
    }),
    properties: Property.Json({
      displayName: 'Properties (Schema Changes)',
      description:
        'Optional. A Notion property-schema patch: a map of property name to a type-config object. To ADD or RETYPE a column: { "Priority": { "select": { "options": [ { "name": "High" } ] } } }. To RENAME a column, key by its current name with { "name": "New Name" }. To REMOVE a column, key by its name with the value null (DESTRUCTIVE — drops that column\'s data). Run notion_get_database first to see current property names and types.',
      required: false,
    }),
  },
  async run(context) {
    const { database_id, title, properties } = context.propsValue;

    if (!database_id) {
      throw new Error('Database ID is required');
    }
    if (
      properties !== undefined &&
      properties !== null &&
      (typeof properties !== 'object' || Array.isArray(properties))
    ) {
      throw new Error(
        'Properties must be a Notion property-schema JSON object (a map of property name to a type-config object, or null to remove a column).'
      );
    }
    if (
      (title === undefined || title === null || title === '') &&
      (properties === undefined || properties === null)
    ) {
      throw new Error(
        'Provide a new title and/or a properties schema patch — nothing to update.'
      );
    }

    const notion = new Client({
      auth: getNotionToken(context.auth),
      notionVersion: '2022-02-22',
    });

    const updateParams: any = {
      database_id: database_id,
    };
    if (title !== undefined && title !== null && title !== '') {
      updateParams.title = [
        {
          type: 'text',
          text: { content: title },
        },
      ];
    }
    if (properties !== undefined && properties !== null) {
      updateParams.properties = properties;
    }

    try {
      const response = await notion.databases.update(updateParams);
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
          `Notion rejected the schema update (validation error): ${error.message}. Check that property names match the existing schema (run notion_get_database) and that each type-config is valid.`
        );
      }
      if (
        error.message?.includes('permissions') ||
        error.message?.includes('unauthorized') ||
        error.code === 'unauthorized'
      ) {
        throw new Error(
          'Unable to update database schema: the integration may lack "update content" capability, or the database is not shared with the integration.'
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
      throw new Error(`Failed to update database schema: ${error.message}`);
    }
  },
});
