import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { redditAuth } from '../../index';

export const editRedditComment = createAction({
  auth: redditAuth,
  name: 'editRedditComment',
  displayName: 'Edit Comment',
  description: 'Edits the content of an existing Reddit comment.',
  props: {
    comment_id: Property.ShortText({
      displayName: 'Comment ID',
      description: 'ID of the Reddit comment to edit (e.g., "def456" or "t1_def456").',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'New Comment Content',
      description: 'Updated text content for the comment.',
      required: true,
    }),
  },
  async run(context) {
    let commentId = context.propsValue.comment_id.trim();
    if (commentId.startsWith('t1_')) {
      commentId = commentId.slice(3);
    }

    const url = 'https://oauth.reddit.com/api/editusertext';
    const payload = new URLSearchParams({
      api_type: 'json',
      thing_id: `t1_${commentId}`,
      text: context.propsValue.content,
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
        error: `Failed to edit comment: ${response.status}`,
        details: response.body,
      };
    }

    return response.body;
  },
});
