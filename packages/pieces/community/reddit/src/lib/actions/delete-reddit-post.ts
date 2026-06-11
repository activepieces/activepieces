import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { redditAuth } from '../auth';

export const deleteRedditPost = createAction({
  auth: redditAuth,
  name: 'deleteRedditPost',
  displayName: 'Delete Post',
  description: 'Delete a specific Reddit post by ID.',
  audience: 'both',
  aiMetadata: { description: 'Deletes a post owned by the authenticated account, identified by post ID. Use it to permanently remove a post you previously created. Requires the post ID (with or without the t3_ prefix). Idempotent — once deleted, repeating the call leaves the same end state.', idempotent: true },
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
