import { createAction } from '@activepieces/pieces-framework';
import { smartsheetApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { sheetDropdown } from '../common/props';
import { smartsheetAuth } from '../../index';

export const findNewComments = createAction({
  auth: smartsheetAuth,
  name: 'find-new-comments',
  displayName: 'Find New Comments',
  description: 'Fetch the list of new comments added to a specific sheet.',
  props: {
    sheetId: sheetDropdown(true),
  },

  async run(context) {
    const { apiKey, region } = context.auth as { apiKey: string; region: string };
    const { sheetId } = context.propsValue;

    const response = await smartsheetApiCall<{
      data: {
        id: number;
        comments: {
          id: number;
          text: string;
          createdAt: string;
          modifiedAt: string;
          createdBy: {
            name: string;
            email: string;
          };
        }[];
      }[];
    }>({
      apiKey,
      region: region as 'default' | 'gov' | 'eu' | 'au' | undefined,
      method: HttpMethod.GET,
      resourceUri: `/sheets/${sheetId}/discussions`,
    });

    const comments = response.data.flatMap(discussion =>
      discussion.comments.map(comment => ({
        discussionId: discussion.id,
        commentId: comment.id,
        text: comment.text,
        createdAt: comment.createdAt,
        modifiedAt: comment.modifiedAt,
        createdBy: comment.createdBy,
      }))
    );

    return comments;
  },
});
