import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { redditAuth } from '../auth';

export const createRedditComment = createAction({
  auth: redditAuth,
  name: 'createRedditComment',
  displayName: 'Create Comment',
  description: 'Comment on a Reddit post or reply to a comment.',
  audience: 'both',
  aiMetadata: { description: 'Posts a comment from the authenticated account, either as a top-level reply to a post or as a nested reply to another comment, determined by the parent ID type (t3_ for a post, t1_ for a comment). Requires the parent ID and the comment text. Not idempotent — each call creates a separate comment.', idempotent: false },
  props: {
    parent_id: Property.ShortText({
      displayName: 'Parent ID',
      description: 'ID of the post (t3_*) or comment (t1_*) to reply to.',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Comment Text',
      description: 'Text of the comment.',
      required: true,
    }),
  },
  async run(context) {
    let parentId = context.propsValue.parent_id.trim();

    // If it's just a post ID, prefix it
    if (!parentId.startsWith('t1_') && !parentId.startsWith('t3_')) {
      parentId = `t3_${parentId}`;
    }

    const url = 'https://oauth.reddit.com/api/comment';
    const payload = new URLSearchParams({
      thing_id: parentId,
      text: context.propsValue.content,
      api_type: 'json',
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
        error: `Failed to create comment: ${response.status}`,
        details: response.body,
      };
    }

    return response.body;
  },
});
