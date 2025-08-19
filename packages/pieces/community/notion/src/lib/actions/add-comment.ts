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
  description:
    'Add a comment to any Notion page to start discussions, provide feedback, or leave notes for team collaboration.',
  props: {
    page_id: notionCommon.page,
    comment_text: Property.LongText({
      displayName: 'Comment Text',
      description:
        'Enter your comment text. Supports plain text and will be posted as a new comment thread on the selected page.',
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
          message:
            '💬 Comment posted successfully! Your comment has been added to the page.',
          comment_id: response.id,
          note: 'Limited comment details available. To see full comment content, ensure your Notion integration has "Read comments" capability enabled in your workspace settings.',
        };
      }

      return {
        success: true,
        message:
          '💬 Comment posted successfully! Your comment has been added to the page.',
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
