import { createAction, Property } from '@activepieces/pieces-framework';
import { niftyAuth } from '../auth';
import { niftyOps } from '../common/operations';
import { assigneesOutputSchema } from '../output-schemas';

export const removeTaskAssignees = createAction({
  auth: niftyAuth,
  name: 'remove_task_assignees',
  displayName: 'Remove Task Assignees',
  description: 'Unassign members from a task, keeping the other assignees.',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Removes one or more members from a Nifty task's assignees and leaves the others in place; the task itself is kept. Requires task_id and at least one member ID. Idempotent: removing someone not assigned changes nothing.",
    idempotent: true,
  },
  props: {
    task_id: Property.ShortText({ displayName: 'Task ID', required: true }),
    member_ids: Property.Array({
      displayName: 'Member IDs',
      description: 'Member IDs from List Members.',
      required: true,
    }),
  },
  outputSchema: assigneesOutputSchema,
  async run(context) {
    return niftyOps.changeAssignees({
      auth: context.auth,
      taskId: context.propsValue.task_id,
      memberIds: context.propsValue.member_ids,
      mode: 'remove',
    });
  },
});
