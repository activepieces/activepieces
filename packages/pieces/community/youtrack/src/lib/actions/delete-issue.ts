import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { issueDropdown } from '../common';
import { youtrackClient } from '../common/client';
import { deleteIssueActionOutputSchema } from '../output-schemas';

export const deleteIssueAction = createAction({
  auth: youtrackAuth,
  name: 'delete_issue',
  classification: 'DESTRUCTIVE',
  outputSchema: deleteIssueActionOutputSchema,
  displayName: 'Delete Issue',
  description: 'Permanently deletes an issue. This cannot be undone.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently delete an issue (ID like "2-38" or "APT-5") with its comments, attachments and history; this cannot be undone. Prefer Update Issue or Apply Command to resolve an issue instead. Not idempotent: a second call fails because the issue no longer exists.',
    idempotent: false,
  },
  props: { issue: issueDropdown },
  async run(context) {
    await youtrackClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/issues/${youtrackClient.segment({ value: context.propsValue.issue, label: 'Issue' })}`,
      operation: 'delete the issue',
    });
    return { success: true, issue_id: context.propsValue.issue };
  },
});
