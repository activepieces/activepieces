import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { LinearConnection, linearMappers } from '../../common/mappers';
import { atomicMappers, atomicProps, LinearCommentNode } from './common';
import { COMMENTS_LIST_QUERY } from './queries';
import { atomicCommentsPageOutputSchema } from './output-schemas';

export const linearCommentsListAtomic = createAction({
  auth: linearAuth,
  name: 'linear_comments_list',
  classification: 'SEARCH',
  displayName: 'List Comments (AI)',
  description: 'List comments, usually the comments of one issue.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Linear comments with body, author and thread parent, normally for one issue (UUID or identifier like ENG-123), one page at a time. Without an issue it lists recent comments across the workspace. Use to read a discussion or find the comment ID to reply to, resolve or react to. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    issue_id: Property.ShortText({ displayName: 'Issue', description: 'UUID or identifier of the issue, for example ENG-123. Leave empty for every issue.', required: false }),
    limit: atomicProps.limitProp({ fallback: 50, max: 250 }),
    cursor: atomicProps.cursorProp(),
  },
  outputSchema: atomicCommentsPageOutputSchema,
  async run({ auth, propsValue }) {
    const issueId = propsValue.issue_id?.trim()
      ? await linearGraphql.resolveIssueId({ auth, value: propsValue.issue_id })
      : undefined;
    const data = await linearGraphql.request<{ comments: LinearConnection<LinearCommentNode> }>({
      auth,
      query: COMMENTS_LIST_QUERY,
      variables: {
        filter: issueId ? { issue: { id: { eq: issueId } } } : undefined,
        first: linearGraphql.clampLimit({ value: propsValue.limit, fallback: 50, max: 250 }),
        after: propsValue.cursor || undefined,
      },
    });
    return linearMappers.toPage({ connection: data.comments, map: atomicMappers.flattenComment });
  },
});
