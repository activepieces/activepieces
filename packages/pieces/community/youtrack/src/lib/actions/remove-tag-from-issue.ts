import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { issueDropdown, tagDropdown } from '../common';
import { youtrackClient } from '../common/client';
import { removeTagFromIssueActionOutputSchema } from '../output-schemas';

export const removeTagFromIssueAction = createAction({
  auth: youtrackAuth,
  name: 'remove_tag_from_issue',
  classification: 'WRITE',
  outputSchema: removeTagFromIssueActionOutputSchema,
  displayName: 'Remove Tag from Issue',
  description: 'Removes a tag from an issue.',
  audience: 'both',
  aiMetadata: {
    description:
      'Detach a tag from an issue, given the issue ID and the tag ID (from List Tags). Not idempotent: removing a tag that is no longer on the issue fails with HTTP 404.',
    idempotent: false,
  },
  props: {
    issue: issueDropdown,
    tag: tagDropdown,
  },
  async run(context) {
    const issueId = youtrackClient.segment({ value: context.propsValue.issue, label: 'Issue' });
    const tagId = youtrackClient.segment({ value: context.propsValue.tag, label: 'Tag' });
    await youtrackClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/issues/${issueId}/tags/${tagId}`,
      operation: 'remove the tag from the issue',
    });
    return { success: true, issue_id: context.propsValue.issue, tag_id: context.propsValue.tag };
  },
});
