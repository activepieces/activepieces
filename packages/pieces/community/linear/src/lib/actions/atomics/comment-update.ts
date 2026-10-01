import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { atomicMappers, LinearCommentNode } from './common';
import { COMMENT_UPDATE_MUTATION } from './queries';
import { atomicCommentOutputSchema } from './output-schemas';

export const linearCommentUpdateAtomic = createAction({
  auth: linearAuth,
  name: 'linear_comment_update',
  classification: 'WRITE',
  displayName: 'Update Comment (AI)',
  description: 'Replace the text of a comment.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Replaces the markdown body of an existing Linear comment; Linear normally only lets the author edit their own comment. Use to correct or extend a comment the flow posted earlier; use Create Comment to add a new one. Idempotent: setting the same body again leaves the comment unchanged.',
    idempotent: true,
  },
  props: {
    comment_id: Property.ShortText({ displayName: 'Comment ID', description: 'UUID of the comment (from List Comments or Create Comment).', required: true }),
    body: Property.LongText({ displayName: 'Body', description: 'The new comment text in Markdown. Replaces the whole body.', required: true }),
  },
  outputSchema: atomicCommentOutputSchema,
  async run({ auth, propsValue }) {
    if (propsValue.body.trim().length === 0) {
      throw new Error('Body cannot be empty.');
    }
    const data = await linearGraphql.request<{
      commentUpdate: { success: boolean; comment: LinearCommentNode };
    }>({
      auth,
      query: COMMENT_UPDATE_MUTATION,
      variables: { id: propsValue.comment_id.trim(), input: { body: propsValue.body } },
    });
    const payload = linearGraphql.requireSuccess({ payload: data.commentUpdate, what: 'comment update' });
    return atomicMappers.flattenComment(payload.comment);
  },
});
