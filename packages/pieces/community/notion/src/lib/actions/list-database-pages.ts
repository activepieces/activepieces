import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../auth';
import { getNotionToken, notionCommon } from '../common';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export const listDatabasePages = createAction({
  auth: notionAuth,
  name: 'list_database_pages',
  displayName: 'List Pages',
  description:
    'Lists pages in a Notion database with optional field filters and pagination.',
  audience: 'both',
  aiMetadata: {
    description:
      'Queries pages in a specific Notion database, optionally filtering by property values (combined with AND), and returns paginated results. Use when an agent needs to browse or enumerate database records rather than find a single item; requires database_id. Idempotent read-only lookup.',
    idempotent: true,
  },
  props: {
    database_id: notionCommon.database_id,
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
      defaultValue: DEFAULT_LIMIT,
      description: `Number of pages to return (1-${MAX_LIMIT}).`,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      required: false,
      description: 'Pagination cursor from a previous run.',
    }),
    filterDatabaseFields: notionCommon.filterDatabaseFields,
  },
  async run(context) {
    const notion = new Client({
      auth: getNotionToken(context.auth),
      notionVersion: '2022-02-22',
    });

    const databaseId = context.propsValue.database_id;
    const filterFields = context.propsValue.filterDatabaseFields ?? {};

    const limit = Math.min(
      Math.max(context.propsValue.limit ?? DEFAULT_LIMIT, 1),
      MAX_LIMIT
    );

    const { properties } = await notion.databases.retrieve({
      database_id: databaseId as string,
    });

    const filters: any[] = [];

    for (const fieldKey in filterFields) {
      const value = filterFields[fieldKey];

      if (
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
      ) {
        continue;
      }

      const property = properties[fieldKey];

      if (!property) {
        continue;
      }

      switch (property.type) {
        case 'title':
          filters.push({
            property: fieldKey,
            title: {
              contains: value,
            },
          });
          break;
        case 'rich_text':
          filters.push({
            property: fieldKey,
            rich_text: {
              contains: value,
            },
          });
          break;
        case 'number':
          filters.push({
            property: fieldKey,
            number: {
              equals: Number(value),
            },
          });
          break;
        case 'select':
          filters.push({
            property: fieldKey,
            select: {
              equals: value,
            },
          });
          break;
        case 'status':
          filters.push({
            property: fieldKey,
            status: {
              equals: value,
            },
          });
          break;
        case 'checkbox':
          filters.push({
            property: fieldKey,
            checkbox: {
              equals: Boolean(value),
            },
          });
          break;
        case 'email':
          filters.push({
            property: fieldKey,
            email: {
              equals: value,
            },
          });
          break;
        case 'phone_number':
          filters.push({
            property: fieldKey,
            phone_number: {
              equals: value,
            },
          });
          break;
        case 'url':
          filters.push({
            property: fieldKey,
            url: {
              equals: value,
            },
          });
          break;
        case 'date':
          filters.push({
            property: fieldKey,
            date: {
              equals: value,
            },
          });
          break;
        case 'multi_select':
          for (const item of Array.isArray(value) ? value : [value]) {
            filters.push({
              property: fieldKey,
              multi_select: {
                contains: item,
              },
            });
          }
          break;
      }
    }

    const response = await notion.databases.query({
      database_id: databaseId as string,
      page_size: limit,
      start_cursor: context.propsValue.cursor || undefined,
      ...(filters.length > 0
        ? {
            filter: {
              and: filters,
            },
          }
        : {}),
    });

    return {
      success: true,
      data: response.results.map((page: any) => ({
        id: page.id,
        url: page.url,
        createdTime: page.created_time,
        lastEditedTime: page.last_edited_time,
        archived: page.archived,
        properties: page.properties,
      })),
      pagination: {
        count: response.results.length,
        hasMore: response.has_more,
        nextCursor: response.next_cursor,
        limit,
      },
    };
  },
});
