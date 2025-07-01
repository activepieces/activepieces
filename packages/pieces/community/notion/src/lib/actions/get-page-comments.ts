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
  description: 'Fetches unresolved comments from page.',
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

    let allComments: any[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const response = await notion.comments.list({
        block_id: page_id,
        start_cursor: cursor,
      });

      allComments.push(...response.results);
      hasMore = response.has_more;
      cursor = response.next_cursor || undefined;
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

    Object.keys(commentsByDiscussion).forEach(discussionId => {
      commentsByDiscussion[discussionId].sort((a, b) => 
        new Date(a.created_time).getTime() - new Date(b.created_time).getTime()
      );
    });

    pageComments.sort((a, b) => 
      new Date(a.created_time).getTime() - new Date(b.created_time).getTime()
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
  },
});
