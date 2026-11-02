import { createAction } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../../auth';
import { microsoft365PlannerApi } from '../../common/api';
import { microsoft365PlannerTaskListOutputSchema } from '../../output-schemas';

export const listMyTasksAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'microsoft_365_planner_list_my_tasks',
  outputSchema: microsoft365PlannerTaskListOutputSchema,
  displayName: 'List My Tasks',
  description: 'Lists the Planner tasks assigned to you.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists every Planner task assigned to the signed-in user, across all plans, with each task’s plan ID, bucket ID, dates, priority and percent complete.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const tasks = await microsoft365PlannerApi.listMyTasks({ auth });
    return { tasks, count: tasks.length };
  },
});
