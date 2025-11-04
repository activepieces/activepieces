import {
  createAction,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../..';
import { notionCommon } from '../common';

export const getPageComments = createAction({
  auth: notionAuth,
  name: 'get_page_comments',
  displayName: 'Get Page Comments',
  description:
    'Retrieve all comments from a Notion page, organized by discussion threads. Perfect for tracking feedback, managing reviews, or monitoring page discussions.',
  props: {
    page_id: notionCommon.page,
  },
  async run(context) {
    const { page_id } = context.propsValue;

    if (!page_id) {
      throw new Error('Page ID is required');
    }

    const notion = new Client({
      auth: (context.auth as OAuth2PropertyValue).access_token,
      notionVersion: '2022-02-22',
    });

    const allComments: any[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await notion.comments.list({
          block_id: page_id,
          start_cursor: cursor,
        });

        allComments.push(...response.results);
        hasMore = response.has_more;
        cursor = response.next_cursor || undefined;
      } catch (error: any) {
        if (error.message?.includes('permissions')) {
          throw new Error(
            'Integration lacks required "read comments" capability.'
          );
        }
        throw error;
      }
    }

    const commentsByDiscussion: { [key: string]: any[] } = {};
    const pageComments: any[] = [];

    allComments.forEach((comment: any) => {
      if (comment.discussion_id) {
        if (!commentsByDiscussion[comment.discussion_id]) {
          commentsByDiscussion[comment.discussion_id] = [];
        }
        commentsByDiscussion[comment.discussion_id].push(comment);
      } else {
        pageComments.push(comment);
      }
    });

    Object.keys(commentsByDiscussion).forEach((discussionId) => {
      commentsByDiscussion[discussionId].sort(
        (a: any, b: any) =>
          new Date(a.created_time).getTime() -
          new Date(b.created_time).getTime()
      );
    });

    pageComments.sort(
      (a: any, b: any) =>
        new Date(a.created_time).getTime() - new Date(b.created_time).getTime()
    );

    const threadCount = Object.keys(commentsByDiscussion).length;

    return {
      success: true,
      totalComments: allComments.length,
      pageComments: pageComments,
      discussionThreads: commentsByDiscussion,
      discussionCount: threadCount,
      allComments: allComments,
      summary: {
        totalComments: allComments.length,
        discussionThreads: threadCount,
        standaloneComments: pageComments.length,
      },
      message:
        allComments.length === 0
          ? `📝 No comments found on this page yet.`
          : `💬 Successfully retrieved ${allComments.length} comment${
              allComments.length === 1 ? '' : 's'
            } from page${
              threadCount > 0
                ? ` organized into ${threadCount} discussion thread${
                    threadCount === 1 ? '' : 's'
                  }`
                : ''
            }.`,
    };
  },
});
