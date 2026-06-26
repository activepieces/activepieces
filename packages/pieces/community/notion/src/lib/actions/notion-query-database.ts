import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../auth';
import { getNotionToken } from '../common';

export const notionQueryDatabase = createAction({
  auth: notionAuth,
  name: 'notion_query_database',
  displayName: 'Query Database',
  description:
    "Queries a Notion database with the API's native filter and sort JSON objects (compound AND/OR, ranges, dates, contains, etc.).",
  audience: 'ai',
  aiMetadata: {
    description:
      "Queries a database using Notion's native filter and sort JSON (compound AND/OR, ranges, dates, contains — the full query surface). Use when the match is more than simple field-equals (for which use notion_find_database_item). Call notion_get_database FIRST to learn the property names and types the filter must reference. Read-only and safe to retry.",
    idempotent: true,
  },
  props: {
    database_id: Property.ShortText({
      displayName: 'Database ID',
      description:
        'The id of the database to query. Resolve a database title into its id with notion_search (filter_type=database).',
      required: true,
    }),
    filter: Property.Json({
      displayName: 'Filter',
      description:
        'Optional. A Notion query filter object. A single condition is { "property": "Status", "status": { "equals": "Done" } }; compound is { "and": [ ...conditions ] } or { "or": [ ...conditions ] }. The condition key MUST match the property\'s type (e.g. status:{equals}, select:{equals}, number:{greater_than}, date:{on_or_after}, rich_text:{contains}, checkbox:{equals}). Run notion_get_database first to confirm property names and types. Omit to list all rows.',
      required: false,
    }),
    sorts: Property.Json({
      displayName: 'Sorts',
      description:
        'Optional. An array of Notion sort objects. Sort by a property: [{ "property": "Name", "direction": "ascending" }]; sort by a timestamp: [{ "timestamp": "last_edited_time", "direction": "descending" }]. direction is "ascending" or "descending".',
      required: false,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Maximum number of rows to return (1–100). Defaults to 100.',
      required: false,
    }),
    start_cursor: Property.ShortText({
      displayName: 'Start Cursor',
      description:
        'Optional pagination cursor. Pass the next_cursor returned by a previous call to fetch the next page of results.',
      required: false,
    }),
  },
  async run(context) {
    const { database_id, filter, sorts, page_size, start_cursor } =
      context.propsValue;

    if (!database_id) {
      throw new Error('Database ID is required');
    }

    const notion = new Client({
      auth: getNotionToken(context.auth),
      notionVersion: '2022-02-22',
    });

    if (filter !== undefined && filter !== null && typeof filter !== 'object') {
      throw new Error(
        'Filter must be a Notion filter JSON object (e.g. { "property": "Status", "status": { "equals": "Done" } }).'
      );
    }
    if (sorts !== undefined && sorts !== null && !Array.isArray(sorts)) {
      throw new Error(
        'Sorts must be a JSON array of Notion sort objects (e.g. [{ "property": "Name", "direction": "ascending" }]).'
      );
    }

    const queryParams: any = {
      database_id: database_id,
    };
    if (filter !== undefined && filter !== null) {
      queryParams.filter = filter;
    }
    if (sorts !== undefined && sorts !== null) {
      queryParams.sorts = sorts;
    }
    if (page_size !== undefined && page_size !== null) {
      queryParams.page_size = page_size;
    }
    if (start_cursor) {
      queryParams.start_cursor = start_cursor;
    }

    try {
      const response = await notion.databases.query(queryParams);
      return {
        success: true,
        results: response.results,
        count: response.results.length,
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
          `Notion rejected the query (validation error): ${error.message}. Check that filter property names and condition type-keys match the database schema — run notion_get_database to confirm.`
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
      throw new Error(`Failed to query database: ${error.message}`);
    }
  },
});
