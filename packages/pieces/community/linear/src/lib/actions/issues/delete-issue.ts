import { createAction } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { props } from '../../common/props';
import { linearGraphql } from '../../common/graphql';
import { LinearArchivedIssueNode, linearMappers } from '../../common/mappers';
import { ISSUE_DELETE_MUTATION } from '../../common/queries';
import { archivedIssueOutputSchema } from '../../output-schemas';

export const linearDeleteIssue = createAction({
  auth: linearAuth,
  name: 'linear_delete_issue',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Issue',
  description: 'Move an issue to the trash. Linear keeps it for 30 days, so it can be restored.',
  audience: 'human',
  aiMetadata: {
    description:
      'Moves a Linear issue to the trash, where Linear keeps it for 30 days before deleting it for good; it is never deleted permanently by this action. Use for cleanup or de-duplication flows; to hide a finished issue without deleting it, archive it instead. Not idempotent: a second call on the same issue may fail because it is already in the trash.',
    idempotent: false,
  },
  props: {
    issue_id: props.issue_reference(),
  },
  outputSchema: archivedIssueOutputSchema,
  async run({ auth, propsValue }) {
    const id = await linearGraphql.resolveIssueId({ auth, value: propsValue.issue_id });
    const data = await linearGraphql.request<{
      issueDelete: { success: boolean; entity: LinearArchivedIssueNode | null };
    }>({ auth, query: ISSUE_DELETE_MUTATION, variables: { id } });
    const payload = linearGraphql.requireSuccess({ payload: data.issueDelete, what: 'issue deletion' });
    return linearMappers.flattenArchivedIssue(payload.entity);
  },
});
