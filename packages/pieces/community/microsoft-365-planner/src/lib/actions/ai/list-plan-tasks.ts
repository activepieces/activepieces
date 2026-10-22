import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../../auth';
import { microsoft365PlannerAiProps } from '../../common/ai-props';
import { microsoft365PlannerApi } from '../../common/api';
import { microsoft365PlannerTaskListOutputSchema } from '../../output-schemas';

export const listPlanTasksAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'microsoft_365_planner_list_plan_tasks',
  outputSchema: microsoft365PlannerTaskListOutputSchema,
  displayName: 'List Plan Tasks',
  description: 'Lists the tasks of a Planner plan.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists every task in a Planner plan (Plan ID from List Plans), with IDs, bucket, assignees, dates, priority and percent complete. Title Contains narrows the result to tasks whose title contains the text, case-insensitive. For one bucket use List Bucket Tasks; for your own tasks across plans use List My Tasks.',
    idempotent: true,
  },
  props: {
    planId: microsoft365PlannerAiProps.planId({ required: true }),
    titleContains: Property.ShortText({
      displayName: 'Title Contains',
      description:
        'Only return tasks whose title contains this text (case-insensitive).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const tasks = await microsoft365PlannerApi.listAllTasks({
      auth,
      planId: propsValue.planId,
    });
    const titleContains = propsValue.titleContains?.toLowerCase();
    const matching = titleContains
      ? tasks.filter((task) =>
          task.title?.toLowerCase().includes(titleContains)
        )
      : tasks;
    return { tasks: matching, count: matching.length };
  },
});
