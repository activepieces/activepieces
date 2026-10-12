import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi } from '../../common/client';
import { redditDeleteMessageOutputSchema } from '../../output-schemas';

export const redditDeletePost = createAction({
  auth: redditAuth,
  name: 'reddit_delete_post',
  outputSchema: redditDeleteMessageOutputSchema,
  displayName: 'Delete Post',
  description: 'Permanently deletes one of your posts.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a post you authored; this cannot be undone. Accepts the post id with or without the t3_ prefix. Reddit reports success even when the post is not yours or already deleted, so confirm with Get Posts or Comments by ID if it matters.',
    idempotent: false,
  },
  props: {
    post_id: Property.ShortText({ displayName: 'Post ID', description: 'Post id, e.g. "abc123" or "t3_abc123".', required: true }),
  },
  async run({ auth, propsValue }) {
    const id = redditApi.toFullname({ value: propsValue.post_id, prefix: 't3_' });
    await redditApi.request<unknown>({ auth, method: HttpMethod.POST, path: '/api/del', form: { id } });
    return { success: true, id };
  },
});
