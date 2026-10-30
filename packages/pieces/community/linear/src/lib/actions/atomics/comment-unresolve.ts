import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { atomicMappers, LinearCommentNode } from './common';
import { COMMENT_UNRESOLVE_MUTATION } from './queries';
import { atomicCommentOutputSchema } from './output-schemas';

export const linearCommentUnresolveAtomic = createAction({
  auth: linearAuth,
  name: 'linear_comment_unresolve',
  classification: 'WRITE',
  displayName: 'Unresolve Comment Thread (AI)',
  description: 'Reopen a resolved comment thread.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reopens a resolved Linear comment thread so it shows as open on the issue again; pass the first comment of the thread. Use to undo Resolve Comment Thread when a discussion needs more work. Idempotent: reopening an open thread keeps it open.',
    idempotent: true,
  },
  props: {
    comment_id: Property.ShortText({ displayName: 'Thread Comment ID', description: 'UUID of the first comment of the thread.', required: true }),
  },
  outputSchema: atomicCommentOutputSchema,
  async run({ auth, propsValue }) {
    const data = await linearGraphql.request<{
      commentUnresolve: { success: boolean; comment: LinearCommentNode };
    }>({ auth, query: COMMENT_UNRESOLVE_MUTATION, variables: { id: propsValue.comment_id.trim() } });
    const payload = linearGraphql.requireSuccess({ payload: data.commentUnresolve, what: 'thread reopen' });
    return atomicMappers.flattenComment(payload.comment);
  },
});
