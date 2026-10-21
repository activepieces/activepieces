import { createAction } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../../auth';
import { microsoft365PlannerAiProps } from '../../common/ai-props';
import { microsoft365PlannerApi } from '../../common/api';
import { microsoft365PlannerTaskOutputSchema } from '../../output-schemas';

export const getTaskAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'microsoft_365_planner_get_task',
  outputSchema: microsoft365PlannerTaskOutputSchema,
  displayName: 'Get Task',
  description: 'Gets a Planner task by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one Planner task by its Task ID: title, plan and bucket IDs, assignees, applied categories, dates, priority and percent complete. For the description, checklist and links use Get Task Details.',
    idempotent: true,
  },
  props: {
    taskId: microsoft365PlannerAiProps.taskId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await microsoft365PlannerApi.getTask({
      auth,
      taskId: propsValue.taskId,
    });
  },
});
