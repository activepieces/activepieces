import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { redditAuth } from '../auth';
import { redditApi } from '../common/client';
import { createRedditCommentOutputSchema } from '../output-schemas';

export const createRedditComment = createAction({
  auth: redditAuth,
  name: 'createRedditComment',
  outputSchema: createRedditCommentOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Comment',
  description: 'Comment on a Reddit post or reply to a comment.',
  audience: 'human',
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
    return redditApi.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      allowJsonErrors: true,
      path: '/api/comment',
      form: {
        api_type: 'json',
        thing_id: redditApi.toFullname({ value: context.propsValue.parent_id, prefix: 't3_', accept: ['t1_', 't3_'] }),
        text: context.propsValue.content,
      },
    });
  },
});
