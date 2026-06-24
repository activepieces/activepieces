import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../auth';
import { getNotionToken } from '../common';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export const listDatabases = createAction({
  auth: notionAuth,
  name: 'list_databases',
  displayName: 'List Databases',
  description:
    'Lists Notion databases accessible by the connected account with pagination support.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists Notion databases the connected account can access, sorted by last edited time. Use when an agent needs to discover available databases before querying or writing items; supports pagination via cursor. Idempotent read-only lookup.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: `Number of databases to retrieve (1-${MAX_LIMIT}).`,
      required: false,
      defaultValue: DEFAULT_LIMIT,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Pagination cursor returned from a previous execution.',
      required: false,
    }),
  },
  async run(context) {
    const notion = new Client({
      auth: getNotionToken(context.auth),
      notionVersion: '2022-02-22',
    });

    const limit = Math.min(
      Math.max(context.propsValue.limit ?? DEFAULT_LIMIT, 1),
      MAX_LIMIT
    );

    const response = await notion.search({
      filter: {
        value: 'database',
        property: 'object',
      },
      page_size: limit,
      start_cursor: context.propsValue.cursor || undefined,
      sort: {
        direction: 'descending',
        timestamp: 'last_edited_time',
      },
    });

    const databases = response.results.map((database: any) => ({
      id: database.id,
      title:
        database.title
          ?.map((item: any) => item.plain_text)
          .join('')
          .trim() || 'Untitled',
      url: database.url,
      createdTime: database.created_time,
      lastEditedTime: database.last_edited_time,
      archived: database.archived ?? false,
      icon:
        database.icon?.type === 'emoji'
          ? database.icon.emoji
          : database.icon?.type === 'external'
            ? database.icon.external?.url
            : database.icon?.type === 'file'
              ? database.icon.file?.url
              : undefined,
      cover:
        database.cover?.type === 'external'
          ? database.cover.external?.url
          : database.cover?.type === 'file'
            ? database.cover.file?.url
            : undefined,
      properties: Object.keys(database.properties ?? {}),
    }));

    return {
      success: true,
      data: databases,
      pagination: {
        hasMore: response.has_more,
        nextCursor: response.next_cursor,
        count: databases.length,
        limit,
      },
    };
  },
});
