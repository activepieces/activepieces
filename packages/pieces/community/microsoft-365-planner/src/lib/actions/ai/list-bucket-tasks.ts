import { createAction } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../../auth';
import { microsoft365PlannerAiProps } from '../../common/ai-props';
import { microsoft365PlannerApi } from '../../common/api';
import { microsoft365PlannerTaskListOutputSchema } from '../../output-schemas';

export const listBucketTasksAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'microsoft_365_planner_list_bucket_tasks',
  outputSchema: microsoft365PlannerTaskListOutputSchema,
  displayName: 'List Bucket Tasks',
  description: 'Lists the tasks in a Planner bucket.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists every task in one Planner bucket (Bucket ID from List Buckets), with IDs, assignees, dates, priority and percent complete.',
    idempotent: true,
  },
  props: {
    bucketId: microsoft365PlannerAiProps.bucketId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const tasks = await microsoft365PlannerApi.listBucketTasks({
      auth,
      bucketId: propsValue.bucketId,
    });
    return { tasks, count: tasks.length };
  },
});
