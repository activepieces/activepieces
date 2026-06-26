import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../auth';
import { getNotionToken } from '../common';

export const notionGetPageComments = createAction({
  auth: notionAuth,
  name: 'notion_get_page_comments',
  displayName: 'Get Page Comments',
  description: 'Lists all comments on a page, grouped into discussion threads.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists all comments on a page, grouped into discussion threads. Use to read existing feedback or review discussions. Requires the "Read comments" capability and the page shared with the integration. Read-only.',
    idempotent: true,
  },
  props: {
    page_id: Property.ShortText({
      displayName: 'Page ID',
      description:
        'The id of the page whose comments to list. Resolve via notion_search.',
      required: true,
    }),
  },
  async run(context) {
    const { page_id } = context.propsValue;

    if (!page_id) {
      throw new Error('Page ID is required');
    }

    const notion = new Client({
      auth: getNotionToken(context.auth),
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
        if (
          error.message?.includes('permissions') ||
          error.code === 'unauthorized'
        ) {
          throw new Error(
            'Integration lacks required "Read comments" capability, or the page is not shared with it.'
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

    return {
      totalComments: allComments.length,
      pageComments,
      discussionThreads: commentsByDiscussion,
      discussionCount: Object.keys(commentsByDiscussion).length,
      allComments,
    };
  },
});
