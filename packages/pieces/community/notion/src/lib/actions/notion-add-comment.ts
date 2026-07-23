import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { notionAuth } from '../auth';
import { getNotionToken } from '../common';

export const notionAddComment = createAction({
  auth: notionAuth,
  name: 'notion_add_comment',
  displayName: 'Add Comment',
  description: 'Posts a new comment thread on a Notion page.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Posts a new comment thread on a Notion page. Use to leave feedback or a note on a page for collaborators; resolve page_id via notion_search. The integration token must have the "Insert comments" capability and the page must be shared with it. Each call posts a separate comment.',
    idempotent: false,
  },
  props: {
    page_id: Property.ShortText({
      displayName: 'Page ID',
      description:
        'The id of the page to comment on. Resolve via notion_search.',
      required: true,
    }),
    comment_text: Property.LongText({
      displayName: 'Comment Text',
      description:
        'The plain-text comment to post as a new thread on the page.',
      required: true,
    }),
  },
  async run(context) {
    const { page_id, comment_text } = context.propsValue;

    if (!page_id) {
      throw new Error('Page ID is required');
    }
    if (!comment_text) {
      throw new Error('Comment text is required');
    }

    const notion = new Client({
      auth: getNotionToken(context.auth),
      notionVersion: '2022-02-22',
    });

    const commentData: any = {
      parent: {
        page_id,
      },
      rich_text: [
        {
          text: {
            content: comment_text,
          },
        },
      ],
    };

    try {
      const response = await notion.comments.create(commentData);
      if (response.object === 'comment' && Object.keys(response).length <= 2) {
        return {
          success: true,
          comment_id: response.id,
          note: 'Limited comment details available. To see full comment content, ensure your Notion integration has "Read comments" capability enabled.',
        };
      }
      return {
        success: true,
        comment: response,
      };
    } catch (error: any) {
      if (
        error.message?.includes('permissions') ||
        error.code === 'unauthorized'
      ) {
        throw new Error(
          'Integration lacks required comment capabilities. Ensure your Notion integration has "Insert comments" capability enabled and the page is shared with it.'
        );
      }
      throw error;
    }
  },
});
