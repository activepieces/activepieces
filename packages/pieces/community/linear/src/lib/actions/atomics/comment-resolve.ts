import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { atomicMappers, LinearCommentNode } from './common';
import { COMMENT_RESOLVE_MUTATION } from './queries';
import { atomicCommentOutputSchema } from './output-schemas';

export const linearCommentResolveAtomic = createAction({
  auth: linearAuth,
  name: 'linear_comment_resolve',
  classification: 'WRITE',
  displayName: 'Resolve Comment Thread (AI)',
  description: 'Mark a comment thread as resolved.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Marks a Linear comment thread as resolved, which collapses it on the issue; pass the top comment of the thread, optionally with the reply that resolved it. Use when a question in a thread has been answered; use Unresolve Comment Thread to reopen it. Idempotent: resolving a resolved thread keeps it resolved.',
    idempotent: true,
  },
  props: {
    comment_id: Property.ShortText({ displayName: 'Thread Comment ID', description: 'UUID of the first comment of the thread.', required: true }),
    resolving_comment_id: Property.ShortText({ displayName: 'Resolving Reply ID', description: 'UUID of the reply that resolved the thread, if any.', required: false }),
  },
  outputSchema: atomicCommentOutputSchema,
  async run({ auth, propsValue }) {
    const data = await linearGraphql.request<{
      commentResolve: { success: boolean; comment: LinearCommentNode };
    }>({
      auth,
      query: COMMENT_RESOLVE_MUTATION,
      variables: {
        id: propsValue.comment_id.trim(),
        resolvingCommentId: propsValue.resolving_comment_id?.trim() || undefined,
      },
    });
    const payload = linearGraphql.requireSuccess({ payload: data.commentResolve, what: 'thread resolve' });
    return atomicMappers.flattenComment(payload.comment);
  },
});
