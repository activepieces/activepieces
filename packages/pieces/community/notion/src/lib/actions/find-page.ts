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
  description: 'Search for a page by title text, with exact-match option.',
  props: {
    title: Property.ShortText({
      displayName: 'Page Title',
      description: 'The title text to search for',
      required: true,
    }),
    exact_match: Property.Checkbox({
      displayName: 'Exact Match',
      description: 'Whether to search for exact title match or partial match',
      required: false,
      defaultValue: false,
    }),
    limit: Property.Number({
      displayName: 'Result Limit',
      description: 'Maximum number of pages to return (1-100)',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const { title, exact_match, limit } = context.propsValue;

    // Input validation
    if (!title || title.trim() === '') {
      throw new Error('Page title is required');
    }

    if (title.length < 2) {
      throw new Error('Search term must be at least 2 characters long');
    }

    const searchLimit = Math.min(Math.max(limit || 10, 1), 100);

    const notion = new Client({
      auth: (context.auth as OAuth2PropertyValue).access_token,
      notionVersion: '2022-02-22',
    });

    try {
      const allPages: any[] = [];
      let cursor: string | undefined;
      let hasMore = true;
      let pageCount = 0;
      const maxPages = 10; // Limit pagination to prevent excessive API calls

      while (hasMore && allPages.length < searchLimit && pageCount < maxPages) {
        try {
          const response = await notion.search({
            query: title.trim(),
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

          // Filter out archived pages and validate page structure
          const validPages = response.results.filter((page: any) => {
            return (
              page &&
              typeof page === 'object' &&
              !page.archived &&
              page.id &&
              page.url
            );
          });

          allPages.push(...validPages);
          hasMore = response.has_more;
          cursor = response.next_cursor || undefined;
          pageCount++;

          // Add delay to avoid rate limiting
          if (hasMore) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        } catch (searchError: any) {
          if (searchError.code === 'rate_limited') {
            throw new Error(
              'Search rate limit exceeded. Please wait a moment and try again.'
            );
          }
          // For other search errors, log and continue with what we have
          console.warn('Search pagination error:', searchError);
          break;
        }
      }

      if (pageCount >= maxPages) {
        console.warn(
          'Reached maximum search pages. Some results may be missing.'
        );
      }

      // Process and filter results
      const processedPages = allPages.map((page: any) => {
        const pageTitle = extractPageTitle(page);
        const pageInfo = {
          id: page.id,
          title: pageTitle || 'Untitled',
          url: page.url,
          created_time: page.created_time,
          last_edited_time: page.last_edited_time,
          archived: page.archived || false,
          parent: page.parent,
        };

        return {
          ...pageInfo,
          matches_exact: exact_match
            ? pageTitle?.toLowerCase() === title.toLowerCase()
            : false,
          matches_partial: !exact_match
            ? pageTitle?.toLowerCase().includes(title.toLowerCase())
            : false,
        };
      });

      // Apply filtering based on search type
      let filteredPages = processedPages;

      if (exact_match) {
        filteredPages = processedPages.filter((page) => page.matches_exact);
      } else {
        filteredPages = processedPages.filter((page) => page.matches_partial);
      }

      // Apply limit and sort by relevance (exact matches first, then by last edited time)
      const limitedResults = filteredPages
        .sort((a, b) => {
          // Sort exact matches first
          if (a.matches_exact && !b.matches_exact) return -1;
          if (!a.matches_exact && b.matches_exact) return 1;

          // Then sort by last edited time
          return (
            new Date(b.last_edited_time).getTime() -
            new Date(a.last_edited_time).getTime()
          );
        })
        .slice(0, searchLimit);

      return {
        success: true,
        searchTerm: title.trim(),
        exactMatch: exact_match,
        totalFound: filteredPages.length,
        returned: limitedResults.length,
        pages: limitedResults,
        message: `Found ${filteredPages.length
          } page(s) matching "${title.trim()}"${exact_match ? ' (exact match)' : ' (partial match)'
          }`,
      };
    } catch (error: any) {
      // Focus on actionable errors that users can solve
      if (
        error.message?.includes('capabilities') ||
        error.message?.includes('permission')
      ) {
        throw new Error(
          'Integration lacks required comment capabilities. Please ensure your Notion integration has "Insert comments" capability enabled.'
        );
      }
      throw error;
    }
  },
});

function extractPageTitle(page: any): string | null {
  try {
    if (!page || !page.properties) {
      return null;
    }

    // Look for title property
    for (const [key, prop] of Object.entries(page.properties)) {
      if ((prop as any).type === 'title') {
        const titleArray = (prop as any).title;
        if (titleArray && Array.isArray(titleArray) && titleArray.length > 0) {
          const firstTitle = titleArray[0];
          if (firstTitle && typeof firstTitle === 'object') {
            return (
              firstTitle.plain_text || firstTitle.text?.content || 'Untitled'
            );
          }
        }
        return null;
      }
    }

    // Fallback: look for any rich_text property that might contain a title
    for (const [key, prop] of Object.entries(page.properties)) {
      if ((prop as any).type === 'rich_text') {
        const richTextArray = (prop as any).rich_text;
        if (
          richTextArray &&
          Array.isArray(richTextArray) &&
          richTextArray.length > 0
        ) {
          const firstText = richTextArray[0];
          if (firstText && typeof firstText === 'object') {
            return firstText.plain_text || firstText.text?.content || null;
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.warn('Error extracting page title:', error);
    return null;
  }
}
