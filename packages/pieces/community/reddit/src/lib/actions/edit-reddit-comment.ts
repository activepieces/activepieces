import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { redditAuth } from '../auth';
import { redditApi } from '../common/client';
import { createRedditCommentOutputSchema } from '../output-schemas';

export const editRedditComment = createAction({
  auth: redditAuth,
  name: 'editRedditComment',
  outputSchema: createRedditCommentOutputSchema,
  classification: 'WRITE',
  displayName: 'Edit Comment',
  description: 'Edits the content of an existing Reddit comment.',
  audience: 'human',
  aiMetadata: { description: 'Replaces the text of an existing comment owned by the authenticated account, identified by comment ID. Use it to update a comment you previously posted. Requires the comment ID (with or without the t1_ prefix) and the new content. Idempotent — repeating with the same content leaves the comment in the same state.', idempotent: true },
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
    return redditApi.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      allowJsonErrors: true,
      path: '/api/editusertext',
      form: {
        api_type: 'json',
        thing_id: redditApi.toFullname({ value: context.propsValue.comment_id, prefix: 't1_' }),
        text: context.propsValue.content,
      },
    });
  },
});
