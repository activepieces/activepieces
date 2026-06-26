import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../auth';
import { getNotionToken } from '../common';

export const notionSearch = createAction({
  auth: notionAuth,
  name: 'notion_search',
  displayName: 'Search Pages and Databases',
  description:
    'Searches the workspace by title for pages and/or databases shared with the integration, with exact or partial matching.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches the workspace by title for pages and/or databases shared with the integration, with exact or partial matching. Use this FIRST to resolve a human-readable name into a page or database id before acting on it. Only returns items shared with the integration. Read-only.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'The title text (or part of it) to search for.',
      required: true,
    }),
    filter_type: Property.StaticDropdown({
      displayName: 'Type Filter',
      description:
        'Restrict results to pages, databases, or both. Defaults to both (all).',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'Pages only', value: 'page' },
          { label: 'Databases only', value: 'database' },
          { label: 'All (pages and databases)', value: 'all' },
        ],
      },
    }),
    exact_match: Property.Checkbox({
      displayName: 'Exact Match',
      description:
        'When enabled, only return items whose title exactly equals the query. Disable for partial matching.',
      required: false,
      defaultValue: false,
    }),
    limit: Property.Number({
      displayName: 'Maximum Results',
      description: 'How many items to return at most (between 1 and 100).',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const { query, filter_type, exact_match, limit } = context.propsValue;

    if (!query) {
      throw new Error('Query is required');
    }

    const searchLimit = Math.min(Math.max(limit || 10, 1), 100);

    const notion = new Client({
      auth: getNotionToken(context.auth),
      notionVersion: '2022-02-22',
    });

    const filterValue = filter_type ?? 'all';

    const allResults: any[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore && allResults.length < searchLimit) {
      const response = await notion.search({
        query,
        ...(filterValue !== 'all'
          ? {
              filter: {
                property: 'object',
                value: filterValue as 'page' | 'database',
              },
            }
          : {}),
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time',
        },
        start_cursor: cursor,
        page_size: Math.min(100, searchLimit - allResults.length),
      });

      allResults.push(...response.results);
      hasMore = response.has_more;
      cursor = response.next_cursor || undefined;
    }

    let filtered = allResults;
    if (exact_match) {
      filtered = allResults.filter((item: any) => {
        const itemTitle = extractTitle(item);
        return itemTitle && itemTitle.toLowerCase() === query.toLowerCase();
      });
    } else {
      filtered = allResults.filter((item: any) => {
        const itemTitle = extractTitle(item);
        return (
          itemTitle && itemTitle.toLowerCase().includes(query.toLowerCase())
        );
      });
    }

    const limited = filtered.slice(0, searchLimit);

    const results = limited.map((item: any) => ({
      id: item.id,
      object: item.object,
      title: extractTitle(item),
      url: item.url,
      created_time: item.created_time,
      last_edited_time: item.last_edited_time,
      archived: item.archived,
      parent: item.parent,
    }));

    return {
      results,
      count: results.length,
    };
  },
});

function extractTitle(item: any): string | null {
  try {
    // Databases carry a top-level `title` rich-text array.
    if (item.object === 'database' && Array.isArray(item.title)) {
      return item.title[0]?.plain_text ?? item.title[0]?.text?.content ?? null;
    }
    // Pages carry the title inside their properties.
    if (item.properties) {
      for (const [, prop] of Object.entries(item.properties)) {
        if ((prop as any).type === 'title') {
          const titleArray = (prop as any).title;
          if (titleArray && titleArray.length > 0) {
            return (
              titleArray[0].plain_text ||
              titleArray[0].text?.content ||
              'Untitled'
            );
          }
          return null;
        }
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}
