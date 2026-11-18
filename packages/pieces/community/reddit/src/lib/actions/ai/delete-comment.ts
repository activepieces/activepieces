import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi } from '../../common/client';
import { redditDeleteMessageOutputSchema } from '../../output-schemas';

export const redditDeleteComment = createAction({
  auth: redditAuth,
  name: 'reddit_delete_comment',
  outputSchema: redditDeleteMessageOutputSchema,
  displayName: 'Delete Comment',
  description: 'Permanently deletes one of your comments.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a comment you authored; this cannot be undone. Accepts the comment id with or without the t1_ prefix. Reddit reports success even when the comment is not yours or already deleted.',
    idempotent: false,
  },
  props: {
    comment_id: Property.ShortText({ displayName: 'Comment ID', description: 'Comment id, e.g. "def456" or "t1_def456".', required: true }),
  },
  async run({ auth, propsValue }) {
    const id = redditApi.toFullname({ value: propsValue.comment_id, prefix: 't1_' });
    await redditApi.request<unknown>({ auth, method: HttpMethod.POST, path: '/api/del', form: { id } });
    return { success: true, id };
  },
});
