import { createAction } from '@activepieces/pieces-framework';
import { microsoft365PlannerAuth, microsoft365PlannerCommon } from '../common';
import { PlanDropdown, TaskDropdown } from '../common/properties';

export const deleteTask = createAction({
  auth: microsoft365PlannerAuth,
  name: 'deleteTask',
  displayName: 'Delete Task',
  description: 'Remove a specific task by ID.',
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
