import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../auth';
import { getNotionToken } from '../common';

export const notionFindDatabaseItem = createAction({
  auth: notionAuth,
  name: 'notion_find_database_item',
  displayName: 'Find Database Item',
  description:
    'Finds rows in a Notion database matching a raw Notion filter object, returning the first match and all matches.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Finds rows in a database matching a Notion filter object and returns the matches (plus the first match for convenience). Use to look up existing records by field value before reading or updating them; for large result sets or pure listing use notion_query_database. Call notion_get_database FIRST to learn property names and types the filter must reference. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    database_id: Property.ShortText({
      displayName: 'Database ID',
      description:
        'The id of the database to search. Resolve a database title into its id with notion_search (filter_type=database).',
      required: true,
    }),
    filter: Property.Json({
      displayName: 'Filter',
      description:
        'A Notion query filter object. A single condition is { "property": "Email", "email": { "equals": "a@b.com" } }; compound is { "and": [ ...conditions ] } or { "or": [ ...conditions ] }. The condition key MUST match the property\'s type (e.g. title:{equals}, rich_text:{contains}, select:{equals}, status:{equals}, number:{equals}, checkbox:{equals}, date:{equals}, multi_select:{contains}). Run notion_get_database first to confirm property names and types.',
      required: true,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Maximum number of rows to return (1–100). Defaults to 100.',
      required: false,
    }),
  },
  async run(context) {
    const { database_id, filter, page_size } = context.propsValue;

    if (!database_id) {
      throw new Error('Database ID is required');
    }
    if (
      filter === undefined ||
      filter === null ||
      typeof filter !== 'object' ||
      Array.isArray(filter)
    ) {
      throw new Error(
        'Filter must be a Notion filter JSON object (e.g. { "property": "Name", "title": { "equals": "Task 1" } }). Run notion_get_database to learn the schema, or use notion_query_database to list without a filter.'
      );
    }

    const notion = new Client({
      auth: getNotionToken(context.auth),
      notionVersion: '2022-02-22',
    });

    const queryParams: any = {
      database_id: database_id,
      filter: filter,
    };
    if (page_size !== undefined && page_size !== null) {
      queryParams.page_size = page_size;
    }

    try {
      const response = await notion.databases.query(queryParams);
      return {
        success: response.results.length > 0,
        results: response.results,
        count: response.results.length,
        firstMatch: response.results[0] ?? null,
        has_more: response.has_more,
        next_cursor: response.next_cursor,
      };
    } catch (error: any) {
      if (
        error.code === 'validation_error' ||
        error.message?.includes('validation_error') ||
        error.status === 400
      ) {
        throw new Error(
          `Notion rejected the filter (validation error): ${error.message}. Check that the filter property names and condition type-keys match the database schema — run notion_get_database to confirm.`
        );
      }
      if (
        error.message?.includes('permissions') ||
        error.message?.includes('unauthorized') ||
        error.code === 'unauthorized'
      ) {
        throw new Error(
          'Unable to query database: the integration may lack read access, or the database is not shared with the integration.'
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
      throw new Error(`Failed to find database item: ${error.message}`);
    }
  },
});
