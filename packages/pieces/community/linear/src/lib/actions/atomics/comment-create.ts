import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { atomicMappers, LinearCommentNode } from './common';
import { COMMENT_CREATE_MUTATION } from './queries';
import { atomicCommentOutputSchema } from './output-schemas';

export const linearCommentCreateAtomic = createAction({
  auth: linearAuth,
  name: 'linear_comment_create',
  classification: 'WRITE',
  displayName: 'Create Comment (AI)',
  description: 'Post a comment on an issue, or reply inside an existing comment thread.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Posts a markdown comment on a Linear issue (UUID or identifier like ENG-123) as the API key owner, optionally as a reply in the thread of an existing comment. Use to add notes or updates to an issue; use Update Comment to edit one. Not idempotent: each call posts a new comment.',
    idempotent: false,
  },
  props: {
    issue_id: Property.ShortText({ displayName: 'Issue', description: 'UUID or identifier of the issue, for example ENG-123.', required: true }),
    body: Property.LongText({ displayName: 'Body', description: 'Comment text in Markdown.', required: true }),
    parent_id: Property.ShortText({ displayName: 'Reply To Comment ID', description: 'UUID of a comment on the same issue to reply to (from List Comments). Leave empty for a new thread.', required: false }),
  },
  outputSchema: atomicCommentOutputSchema,
  async run({ auth, propsValue }) {
    if (propsValue.body.trim().length === 0) {
      throw new Error('Body cannot be empty.');
    }
    const issueId = await linearGraphql.resolveIssueId({ auth, value: propsValue.issue_id });
    const data = await linearGraphql.request<{
      commentCreate: { success: boolean; comment: LinearCommentNode };
    }>({
      auth,
      query: COMMENT_CREATE_MUTATION,
      variables: {
        input: linearGraphql.definedOnly({ issueId, body: propsValue.body, parentId: propsValue.parent_id }),
      },
    });
    const payload = linearGraphql.requireSuccess({ payload: data.commentCreate, what: 'comment' });
    return atomicMappers.flattenComment(payload.comment);
  },
});
