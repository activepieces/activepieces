import { createAction } from '@activepieces/pieces-framework';
import { microsoft365PlannerAuth } from '../auth';
import { microsoft365PlannerApi } from '../common/api';
import { microsoft365PlannerProps } from '../common/props';
import { microsoft365PlannerSuccessOutputSchema } from '../output-schemas';

export const deleteTaskAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'deleteTask',
  outputSchema: microsoft365PlannerSuccessOutputSchema,
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Task',
  description: 'Remove a specific task by ID.',
  audience: 'human',
  aiMetadata: {
    description: 'Permanently deletes a task from a Planner plan by task ID. Use to remove a work item. Destructive and not idempotent; once removed, repeating the call fails because the task no longer exists.',
    idempotent: false,
  },
  props: {
    planId: microsoft365PlannerProps.planId({ required: true }),
    id: microsoft365PlannerProps.taskId({ required: true }),
  },
  async run({ auth, propsValue: { id } }) {
    if (!id) {
      throw new Error('Task id is required');
    }
    return await microsoft365PlannerApi.deleteTask({
      auth,
      id,
    });
  },
});
