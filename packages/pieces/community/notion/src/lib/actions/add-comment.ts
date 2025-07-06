import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../..';
import { notionCommon } from '../common';

export const addComment = createAction({
  auth: notionAuth,
  name: 'add_comment',
  displayName: 'Add Comment',
  description: 'Post a new comment to a page.',
  props: {
    page_id: notionCommon.page,
    comment_text: Property.LongText({
      displayName: 'Comment Text',
      description: 'The text content of the comment',
      required: true,
    }),
  },
  async run(context) {
    const { page_id, comment_text } = context.propsValue;

    if (!comment_text) {
      throw new Error('Comment text is required');
    }

    const notion = new Client({
      auth: (context.auth as OAuth2PropertyValue).access_token,
      notionVersion: '2022-02-22',
    });

    const commentData: any = {
      rich_text: [
        {
          text: {
            content: comment_text,
          },
        },
      ],
    };

    if (!page_id) {
      throw new Error('Page ID is required');
    }

    commentData.parent = {
      page_id: page_id,
    };

    try {
      const response = await notion.comments.create(commentData);
      if (response.object === 'comment' && Object.keys(response).length <= 2) {
        return {
          success: true,
          message: 'Comment added to page successfully (partial response)',
          comment_id: response.id,
          note: 'Full comment details not available. Your integration may need "read comments" capability for complete response.',
        };
      }

      return {
        success: true,
        message: 'Comment added to page successfully',
        comment: response,
      };
    } catch (error: any) {
      if (error.message?.includes('permissions')) {
        throw new Error(
          'Integration lacks required comment capabilities. Please ensure your Notion integration has "Insert comments" capability enabled.'
        );
      }
      throw error;
    }
  },
});
