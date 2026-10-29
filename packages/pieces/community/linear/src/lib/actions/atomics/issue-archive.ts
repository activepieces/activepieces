import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { LinearArchivedIssueNode, linearMappers } from '../../common/mappers';
import { ISSUE_ARCHIVE_MUTATION } from './queries';
import { atomicArchivedIssueOutputSchema } from './output-schemas';

export const linearIssueArchiveAtomic = createAction({
  auth: linearAuth,
  name: 'linear_issue_archive',
  classification: 'DESTRUCTIVE',
  displayName: 'Archive Issue (AI)',
  description: 'Archive an issue so it leaves active views. It can be restored.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Archives a Linear issue so it disappears from active views and boards while staying searchable; restore it with Unarchive Issue. Use to tidy finished or obsolete work without deleting it; use Delete Issue to move it to the trash. Idempotent: archiving an already archived issue leaves it archived.',
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
      issueArchive: { success: boolean; entity: LinearArchivedIssueNode | null };
    }>({ auth, query: ISSUE_ARCHIVE_MUTATION, variables: { id } });
    const payload = linearGraphql.requireSuccess({ payload: data.issueArchive, what: 'issue archive' });
    return linearMappers.flattenArchivedIssue(payload.entity);
  },
});
