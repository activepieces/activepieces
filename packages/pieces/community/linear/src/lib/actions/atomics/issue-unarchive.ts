import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { LinearArchivedIssueNode, linearMappers } from '../../common/mappers';
import { ISSUE_UNARCHIVE_MUTATION } from './queries';
import { atomicArchivedIssueOutputSchema } from './output-schemas';

export const linearIssueUnarchiveAtomic = createAction({
  auth: linearAuth,
  name: 'linear_issue_unarchive',
  classification: 'WRITE',
  displayName: 'Unarchive Issue (AI)',
  description: 'Restore an archived or trashed issue.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Restores a Linear issue that was archived or moved to the trash (within the 30-day grace period), bringing it back to active views. Use to undo Archive Issue or Delete Issue. Idempotent: restoring an active issue leaves it active.',
    idempotent: true,
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
      issueUnarchive: { success: boolean; entity: LinearArchivedIssueNode | null };
    }>({ auth, query: ISSUE_UNARCHIVE_MUTATION, variables: { id } });
    const payload = linearGraphql.requireSuccess({ payload: data.issueUnarchive, what: 'issue restore' });
    return linearMappers.flattenArchivedIssue(payload.entity);
  },
});
