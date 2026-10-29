import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { redditAuth } from '../auth';
import { redditApi } from '../common/client';
import { editRedditPostOutputSchema } from '../output-schemas';

export const editRedditPost = createAction({
  auth: redditAuth,
  name: 'editRedditPost',
  outputSchema: editRedditPostOutputSchema,
  classification: 'WRITE',
  displayName: 'Edit Post',
  description: 'Edits the content of an existing Reddit post.',
  audience: 'human',
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
    return redditApi.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      allowJsonErrors: true,
      path: '/api/editusertext',
      form: {
        api_type: 'json',
        thing_id: redditApi.toFullname({ value: context.propsValue.post_id, prefix: 't3_' }),
        text: context.propsValue.content,
      },
    });
  },
});
