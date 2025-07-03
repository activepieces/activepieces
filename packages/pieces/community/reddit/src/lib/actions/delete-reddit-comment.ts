import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { redditAuth } from '../../index';

export const deleteRedditComment = createAction({
  auth: redditAuth,
  name: 'deleteRedditComment',
  displayName: 'Delete Comment',
  description: 'Delete a specific Reddit comment by ID.',
  props: {
    comment_id: Property.ShortText({
      displayName: 'Comment ID',
      description: 'ID of the Reddit comment to delete (e.g., "def456" or "t1_def456").',
      required: true,
    }),
  },
  async run(context) {
    let commentId = context.propsValue.comment_id.trim();
    if (commentId.startsWith('t1_')) {
      commentId = commentId.slice(3);
    }

    const url = 'https://oauth.reddit.com/api/del';
    const payload = new URLSearchParams({
      api_type: 'json',
      id: `t1_${commentId}`,
    });

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url,
      headers: {
        'Authorization': `Bearer ${context.auth.access_token}`,
        'User-Agent': 'ActivePieces Reddit Client',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload.toString(),
    });

    if (response.status !== 200) {
      return {
        error: `Failed to delete comment: ${response.status}`,
        details: response.body,
      };
    }

    return { success: true, response: response.body };
  },
});
