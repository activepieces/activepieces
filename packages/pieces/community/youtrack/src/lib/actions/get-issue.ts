import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { issueDropdown, ISSUE_FIELDS, flattenIssue } from '../common';
import { youtrackClient } from '../common/client';
import { getIssueActionOutputSchema } from '../output-schemas';

export const getIssueAction = createAction({
  auth: youtrackAuth,
  name: 'get_issue',
  classification: 'READ',
  outputSchema: getIssueActionOutputSchema,
  displayName: 'Get Issue',
  description: 'Retrieves full details of an issue including all custom field values.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch the full details of a single issue by its ID (like "2-38" or "APT-5"), including summary, description, tags and all custom field values. It does not return attachments or comments; use List Attachments and List Comments for those. Read-only and idempotent.',
    idempotent: true,
  },
  props: { issue: issueDropdown },
  async run(context) {
    const response = await youtrackClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/issues/${youtrackClient.segment({ value: context.propsValue.issue, label: 'Issue' })}`,
      query: { fields: ISSUE_FIELDS },
      operation: 'read the issue',
    });
    return flattenIssue(youtrackClient.recordOf(response));
  },
});
