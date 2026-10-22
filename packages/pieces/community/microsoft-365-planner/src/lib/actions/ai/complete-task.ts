import { createAction } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../../auth';
import { microsoft365PlannerAiProps } from '../../common/ai-props';
import { microsoft365PlannerApi } from '../../common/api';
import { microsoft365PlannerTaskOutputSchema } from '../../output-schemas';

export const completeTaskAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'microsoft_365_planner_complete_task',
  outputSchema: microsoft365PlannerTaskOutputSchema,
  displayName: 'Complete Task',
  description: 'Marks a Planner task as completed.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Marks a Planner task completed (sets percent complete to 100) and returns the updated task. To reopen a task, use Update Task with a lower percent complete.',
    idempotent: true,
  },
  props: {
    taskId: microsoft365PlannerAiProps.taskId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await microsoft365PlannerApi.patchTask({
      auth,
      taskId: propsValue.taskId,
      fields: { percentComplete: 100 },
    });
  },
});
