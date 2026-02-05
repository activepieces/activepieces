import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../..';

export const findPage = createAction({
  auth: notionAuth,
  name: 'find_page',
  displayName: 'Find Page',
  description:
    'Search for Notion pages by title with flexible matching options. Perfect for finding specific pages, building page references, or creating automated workflows based on page discovery.',
  props: {
    title: Property.ShortText({
      displayName: 'Page Title',
      description:
        'Enter the page title or part of the title you want to search for',
      required: true,
    }),
    exact_match: Property.Checkbox({
      displayName: 'Exact Match',
      description:
        'Enable this to find pages with exactly the same title. Disable for partial matching (finds pages containing your search term).',
      required: false,
      defaultValue: false,
    }),
    limit: Property.Number({
      displayName: 'Maximum Results',
      description: 'How many pages to return at most (between 1 and 100)',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const { title, exact_match, limit } = context.propsValue;

    if (!title) {
      throw new Error('Page title is required');
    }

    const searchLimit = Math.min(Math.max(limit || 10, 1), 100);

    const notion = new Client({
      auth: (context.auth as OAuth2PropertyValue).access_token,
      notionVersion: '2022-02-22',
    });

    const allPages: any[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore && allPages.length < searchLimit) {
      const response = await notion.search({
        query: title,
        filter: {
          property: 'object',
          value: 'page',
        },
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time',
        },
        start_cursor: cursor,
        page_size: Math.min(100, searchLimit - allPages.length),
      });

      allPages.push(...response.results);
      hasMore = response.has_more;
      cursor = response.next_cursor || undefined;
    }

    // Filter results based on exact match requirement
    let filteredPages = allPages;

    if (exact_match) {
      filteredPages = allPages.filter((page: any) => {
        const pageTitle = extractPageTitle(page);
        return pageTitle && pageTitle.toLowerCase() === title.toLowerCase();
      });
    } else {
      filteredPages = allPages.filter((page: any) => {
        const pageTitle = extractPageTitle(page);
        return (
          pageTitle && pageTitle.toLowerCase().includes(title.toLowerCase())
        );
      });
    }

    const limitedResults = filteredPages.slice(0, searchLimit);

    const formattedResults = limitedResults.map((page: any) => ({
      id: page.id,
      title: extractPageTitle(page),
      url: page.url,
      created_time: page.created_time,
      last_edited_time: page.last_edited_time,
      archived: page.archived,
      parent: page.parent,
      properties: page.properties,
    }));

    const matchType = exact_match ? 'exact match' : 'partial match';
    const resultMessage =
      filteredPages.length === 0
        ? `🔍 No pages found matching "${title}" (${matchType}). Try using partial matching or check your search term.`
        : `🔍 Found ${filteredPages.length} page${
            filteredPages.length === 1 ? '' : 's'
          } matching "${title}" (${matchType})${
            formattedResults.length < filteredPages.length
              ? `, showing first ${formattedResults.length}`
              : ''
          }.`;

    return {
      success: true,
      searchTerm: title,
      exactMatch: exact_match,
      totalFound: filteredPages.length,
      returned: formattedResults.length,
      pages: formattedResults,
      summary: {
        searchTerm: title,
        matchType: matchType,
        totalFound: filteredPages.length,
        returned: formattedResults.length,
        hasMore: filteredPages.length > formattedResults.length,
      },
      message: resultMessage,
    };
  },
});

function extractPageTitle(page: any): string | null {
  try {
    if (page.properties) {
      for (const [, prop] of Object.entries(page.properties)) {
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
