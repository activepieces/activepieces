import { createAction, Property } from '@activepieces/pieces-framework';
import { niftyAuth } from '../auth';
import { niftyOps } from '../common/operations';
import { assigneesOutputSchema } from '../output-schemas';

export const addTaskAssignees = createAction({
  auth: niftyAuth,
  name: 'add_task_assignees',
  displayName: 'Add Task Assignees',
  description: 'Assign members to a task, keeping the current assignees.',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Adds one or more members to a Nifty task's assignees without touching the others. Use after List Members to get member IDs; requires task_id and at least one member ID. Idempotent: adding someone already assigned changes nothing.",
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
      mode: 'add',
    });
  },
});
