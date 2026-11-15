import { createAction } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../../auth';
import { microsoft365PlannerAiProps } from '../../common/ai-props';
import { microsoft365PlannerApi } from '../../common/api';
import { microsoft365PlannerTaskDetailsOutputSchema } from '../../output-schemas';

export const getTaskDetailsAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'microsoft_365_planner_get_task_details',
  outputSchema: microsoft365PlannerTaskDetailsOutputSchema,
  displayName: 'Get Task Details',
  description: 'Gets a task’s description, checklist and links.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets the details of a Planner task: its description, checklist items (keyed by item ID, with title and checked state) and attached links. The checklist item IDs are what Update Task Details needs to check, uncheck or remove items.',
    idempotent: true,
  },
  props: {
    taskId: microsoft365PlannerAiProps.taskId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await microsoft365PlannerApi.getTaskDetails({
      auth,
      taskId: propsValue.taskId,
    });
  },
});
