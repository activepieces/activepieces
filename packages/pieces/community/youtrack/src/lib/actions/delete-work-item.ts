import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { issueDropdown, workItemDropdown } from '../common';
import { youtrackClient } from '../common/client';
import { deleteWorkItemActionOutputSchema } from '../output-schemas';

export const deleteWorkItemAction = createAction({
  auth: youtrackAuth,
  name: 'delete_work_item',
  classification: 'DESTRUCTIVE',
  outputSchema: deleteWorkItemActionOutputSchema,
  displayName: 'Delete Work Item',
  description: 'Deletes a time tracking work item from an issue.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently delete one work item (logged time) from an issue, given the issue ID and the work item ID from Find Work Items. Not idempotent: a second call fails because the work item no longer exists.',
    idempotent: false,
  },
  props: {
    issue: issueDropdown,
    workItem: workItemDropdown,
  },
  async run(context) {
    const issue = youtrackClient.segment({ value: context.propsValue.issue, label: 'Issue' });
    const workItem = youtrackClient.segment({ value: context.propsValue.workItem, label: 'Work Item' });
    await youtrackClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/issues/${issue}/timeTracking/workItems/${workItem}`,
      operation: 'delete the work item',
    });
    return { success: true, issue_id: context.propsValue.issue, work_item_id: context.propsValue.workItem };
  },
});
