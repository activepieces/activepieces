import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { redditAuth } from '../auth';
import { redditApi } from '../common/client';
import { deleteRedditContentOutputSchema } from '../output-schemas';

export const deleteRedditComment = createAction({
  auth: redditAuth,
  name: 'deleteRedditComment',
  outputSchema: deleteRedditContentOutputSchema,
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Comment',
  description: 'Delete a specific Reddit comment by ID.',
  audience: 'human',
  aiMetadata: { description: 'Deletes a comment owned by the authenticated account, identified by comment ID. Use it to permanently remove a comment you previously posted. Requires the comment ID (with or without the t1_ prefix). Idempotent — once deleted, repeating the call leaves the same end state.', idempotent: true },
  props: {
    comment_id: Property.ShortText({
      displayName: 'Comment ID',
      description: 'ID of the Reddit comment to delete (e.g., "def456" or "t1_def456").',
      required: true,
    }),
  },
  async run(context) {
    const response = await redditApi.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      allowJsonErrors: true,
      path: '/api/del',
      form: { api_type: 'json', id: redditApi.toFullname({ value: context.propsValue.comment_id, prefix: 't1_' }) },
    });
    return { success: true, response };
  },
});
