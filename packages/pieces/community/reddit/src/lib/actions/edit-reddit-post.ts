import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { redditAuth } from '../auth';

export const editRedditPost = createAction({
  auth: redditAuth,
  name: 'editRedditPost',
  displayName: 'Edit Post',
  description: 'Edits the content of an existing Reddit post.',
  audience: 'both',
  aiMetadata: { description: 'Replaces the text body of an existing self post owned by the authenticated account, identified by post ID. Use it to update a post you previously created; it only edits text posts, not link or media posts. Requires the post ID (with or without the t3_ prefix) and the new content. Idempotent — repeating with the same content leaves the post in the same state.', idempotent: true },
  props: {
    post_id: Property.ShortText({
      displayName: 'Post ID',
      description: 'ID of the Reddit post to edit (e.g., "abc123" or "t3_abc123").',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'New Post Content',
      description: 'Updated text content for the post.',
      required: true,
    }),
  },
  async run(context) {
    let postId = context.propsValue.post_id.trim();
    if (postId.startsWith('t3_')) {
      postId = postId.slice(3);
    }

    const url = 'https://oauth.reddit.com/api/editusertext';
    const payload = new URLSearchParams({
      api_type: 'json',
      thing_id: `t3_${postId}`,
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
        error: `Failed to edit post: ${response.status}`,
        details: response.body,
      };
    }

    return response.body;
  },
});
