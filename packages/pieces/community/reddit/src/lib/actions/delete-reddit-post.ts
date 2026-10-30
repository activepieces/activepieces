import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { redditAuth } from '../auth';
import { redditApi } from '../common/client';
import { deleteRedditContentOutputSchema } from '../output-schemas';

export const deleteRedditPost = createAction({
  auth: redditAuth,
  name: 'deleteRedditPost',
  outputSchema: deleteRedditContentOutputSchema,
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Post',
  description: 'Delete a specific Reddit post by ID.',
  audience: 'human',
  aiMetadata: { description: 'Deletes a post owned by the authenticated account, identified by post ID. Use it to permanently remove a post you previously created. Requires the post ID (with or without the t3_ prefix). Idempotent — once deleted, repeating the call leaves the same end state.', idempotent: true },
  props: {
    post_id: Property.ShortText({
      displayName: 'Post ID',
      description: 'ID of the Reddit post to delete (e.g., "abc123" or "t3_abc123").',
      required: true,
    }),
  },
  async run(context) {
    const response = await redditApi.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      allowJsonErrors: true,
      path: '/api/del',
      form: { api_type: 'json', id: redditApi.toFullname({ value: context.propsValue.post_id, prefix: 't3_' }) },
    });
    return { success: true, response };
  },
});
