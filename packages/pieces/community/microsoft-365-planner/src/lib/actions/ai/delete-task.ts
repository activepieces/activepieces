import { createAction } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../../auth';
import { microsoft365PlannerAiProps } from '../../common/ai-props';
import { microsoft365PlannerApi } from '../../common/api';
import { microsoft365PlannerDeletedOutputSchema } from '../../output-schemas';

export const deleteTaskAiAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'microsoft_365_planner_delete_task',
  outputSchema: microsoft365PlannerDeletedOutputSchema,
  displayName: 'Delete Task',
  description: 'Permanently deletes a Planner task.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a Planner task. Cannot be undone; repeating the call fails because the task no longer exists. To close a task instead, use Complete Task.',
    idempotent: false,
  },
  props: {
    taskId: microsoft365PlannerAiProps.taskId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await microsoft365PlannerApi.deleteTask({ auth, id: propsValue.taskId });
    return { success: true, id: propsValue.taskId };
  },
});
