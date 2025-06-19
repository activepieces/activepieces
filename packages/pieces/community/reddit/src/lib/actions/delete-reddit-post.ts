import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { redditAuth } from '../../index';

export const deleteRedditPost = createAction({
  auth: redditAuth,
  name: 'deleteRedditPost',
  displayName: 'Delete Post',
  description: 'Delete a specific Reddit post by ID.',
  props: {
    post_id: Property.ShortText({
      displayName: 'Post ID',
      description: 'ID of the Reddit post to delete (e.g., "abc123" or "t3_abc123").',
      required: true,
    }),
  },
  async run(context) {
    let postId = context.propsValue.post_id.trim();
    if (postId.startsWith('t3_')) {
      postId = postId.slice(3);
    }

    const url = 'https://oauth.reddit.com/api/del';
    const payload = new URLSearchParams({
      api_type: 'json',
      id: `t3_${postId}`,
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
        error: `Failed to delete post: ${response.status}`,
        details: response.body,
      };
    }

    return { success: true, response: response.body };
  },
});
