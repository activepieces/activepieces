import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { LinearArchivedIssueNode, linearMappers } from '../../common/mappers';
import { ISSUE_DELETE_MUTATION } from '../../common/queries';
import { atomicArchivedIssueOutputSchema } from './output-schemas';

export const linearIssueDeleteAtomic = createAction({
  auth: linearAuth,
  name: 'linear_issue_delete',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Issue (AI)',
  description: 'Move an issue to the trash (restorable for 30 days).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Moves a Linear issue to the trash; Linear deletes it for good after 30 days, and Unarchive Issue restores it before then. This never deletes permanently. Prefer Archive Issue when the work is only finished. Not idempotent: a second call on a trashed issue may fail.',
    idempotent: false,
  },
  props: {
    issue_id: Property.ShortText({
      displayName: 'Issue',
      description: 'UUID or identifier of the issue, for example ENG-123.',
      required: true,
    }),
  },
  outputSchema: atomicArchivedIssueOutputSchema,
  async run({ auth, propsValue }) {
    const id = await linearGraphql.resolveIssueId({ auth, value: propsValue.issue_id });
    const data = await linearGraphql.request<{
      issueDelete: { success: boolean; entity: LinearArchivedIssueNode | null };
    }>({ auth, query: ISSUE_DELETE_MUTATION, variables: { id } });
    const payload = linearGraphql.requireSuccess({ payload: data.issueDelete, what: 'issue deletion' });
    return linearMappers.flattenArchivedIssue(payload.entity);
  },
});
