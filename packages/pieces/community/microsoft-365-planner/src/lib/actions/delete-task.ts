import { createAction } from '@activepieces/pieces-framework';
import { microsoft365PlannerAuth, microsoft365PlannerCommon } from '../common';
import { PlanDropdown, TaskDropdown } from '../common/properties';

export const deleteTask = createAction({
  auth: microsoft365PlannerAuth,
  name: 'deleteTask',
  displayName: 'Delete Task',
  description: 'Remove a specific task by ID.',
  audience: 'both',
  aiMetadata: {
    description: 'Permanently deletes a task from a Planner plan by task ID. Use to remove a work item. Destructive and not idempotent; once removed, repeating the call fails because the task no longer exists.',
    idempotent: false,
  },
  props: {
    planId: PlanDropdown({ required: true }),
    id: TaskDropdown({ required: true }),
  },
  async run({ auth, propsValue: { id } }) {
    if (!id) {
      throw new Error('Task id is required');
    }
    return await microsoft365PlannerCommon.deleteTask({
      auth,
      id,
    });
  },
});
