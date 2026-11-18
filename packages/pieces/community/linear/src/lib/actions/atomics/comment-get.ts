import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { atomicMappers, LinearCommentNode } from './common';
import { COMMENT_GET_QUERY } from './queries';
import { atomicCommentOutputSchema } from './output-schemas';

export const linearCommentGetAtomic = createAction({
  auth: linearAuth,
  name: 'linear_comment_get',
  classification: 'READ',
  displayName: 'Get Comment (AI)',
  description: 'Get one comment by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one Linear comment by ID with its markdown body, author, issue, parent comment and resolved state. Use when a comment ID is already known (for example from the New Comment trigger); use List Comments to browse an issue\'s comments. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    comment_id: Property.ShortText({ displayName: 'Comment ID', description: 'UUID of the comment.', required: true }),
  },
  outputSchema: atomicCommentOutputSchema,
  async run({ auth, propsValue }) {
    const data = await linearGraphql.request<{ comment: LinearCommentNode | null }>({
      auth,
      query: COMMENT_GET_QUERY,
      variables: { id: propsValue.comment_id.trim() },
    });
    if (!data.comment) {
      throw new Error(`No Linear comment found for ${propsValue.comment_id}.`);
    }
    return atomicMappers.flattenComment(data.comment);
  },
});
