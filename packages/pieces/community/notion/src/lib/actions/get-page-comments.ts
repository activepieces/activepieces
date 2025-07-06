import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../..';
import { notionCommon } from '../common';

export const getPageComments = createAction({
  auth: notionAuth,
  name: 'get_page_comments',
  displayName: 'Get Page Comments',
  description: 'Fetches comments from page.',
  props: {
    page_id: notionCommon.page,
  },
  async run(context) {
    const { page_id } = context.propsValue;

    // Input validation
    if (!page_id) {
      throw new Error('Page ID is required');
    }

    // Validate page ID format (Notion IDs are 32 characters)
    if (!/^[a-zA-Z0-9]{32}$/.test(page_id)) {
      throw new Error(
        'Invalid page ID format. Notion IDs should be 32 characters long.'
      );
    }

    const notion = new Client({
      auth: (context.auth as OAuth2PropertyValue).access_token,
      notionVersion: '2022-02-22',
    });

    try {
      // First, verify the page exists
      const page = await notion.pages.retrieve({
        page_id: page_id,
      });

      if ((page as any).archived) {
        return {
          success: true,
          totalComments: 0,
          pageComments: [],
          discussionThreads: {},
          discussionCount: 0,
          allComments: [],
          message:
            'Page is archived. No comments can be retrieved from archived pages.',
        };
      }

      const allComments: any[] = [];
      let cursor: string | undefined;
      let hasMore = true;
      let pageCount = 0;
      const maxPages = 100; // Prevent infinite loops

      while (hasMore && pageCount < maxPages) {
        try {
          const response = await notion.comments.list({
            block_id: page_id,
            start_cursor: cursor,
          });

          allComments.push(...response.results);
          hasMore = response.has_more;
          cursor = response.next_cursor || undefined;
          pageCount++;

          // Add a small delay to avoid rate limiting
          if (hasMore) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        } catch (paginationError: any) {
          // Handle pagination-specific errors
          if (paginationError.code === 'rate_limited') {
            throw new Error(
              'Rate limit exceeded while fetching comments. Please wait a moment and try again.'
            );
          }
          if (paginationError.code === 'validation_error') {
            throw new Error('Invalid pagination parameters. Please try again.');
          }
          // For other pagination errors, log and continue with what we have
          console.warn('Pagination error:', paginationError);
          break;
        }
      }

      if (pageCount >= maxPages) {
        console.warn(
          'Reached maximum page limit while fetching comments. Some comments may not be retrieved.'
        );
      }

      const commentsByDiscussion: { [key: string]: any[] } = {};
      const pageComments: any[] = [];

      allComments.forEach((comment: any) => {
        // Validate comment structure
        if (!comment || typeof comment !== 'object') {
          console.warn('Skipping invalid comment structure');
          return;
        }

        if (comment.discussion_id) {
          if (!commentsByDiscussion[comment.discussion_id]) {
            commentsByDiscussion[comment.discussion_id] = [];
          }
          commentsByDiscussion[comment.discussion_id].push(comment);
        } else {
          pageComments.push(comment);
        }
      });

      // Sort comments by creation time
      Object.keys(commentsByDiscussion).forEach((discussionId) => {
        commentsByDiscussion[discussionId].sort(
          (a: any, b: any) =>
            new Date(a.created_time).getTime() -
            new Date(b.created_time).getTime()
        );
      });

      pageComments.sort(
        (a: any, b: any) =>
          new Date(a.created_time).getTime() -
          new Date(b.created_time).getTime()
      );

      return {
        success: true,
        totalComments: allComments.length,
        pageComments: pageComments,
        discussionThreads: commentsByDiscussion,
        discussionCount: Object.keys(commentsByDiscussion).length,
        allComments: allComments,
        message: `Retrieved ${allComments.length} comments from page`,
      };
    } catch (error: any) {
      if (error.message?.includes('capabilities')) {
        throw new Error(
          'Integration lacks required "read comments" capability.'
        );
      }
      throw error;
    }
  },
});
