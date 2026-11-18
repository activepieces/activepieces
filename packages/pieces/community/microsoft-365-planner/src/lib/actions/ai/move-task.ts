import { createAction } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../../auth';
import { microsoft365PlannerAiProps } from '../../common/ai-props';
import { microsoft365PlannerApi } from '../../common/api';
import { microsoft365PlannerTaskOutputSchema } from '../../output-schemas';

export const moveTaskAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'microsoft_365_planner_move_task',
  outputSchema: microsoft365PlannerTaskOutputSchema,
  displayName: 'Move Task',
  description: 'Moves a Planner task to another bucket.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Moves a Planner task to another bucket of the same plan (Bucket ID from List Buckets) and returns the updated task. Tasks cannot move between plans.',
    idempotent: true,
  },
  props: {
    taskId: microsoft365PlannerAiProps.taskId({ required: true }),
    bucketId: microsoft365PlannerAiProps.bucketId({
      required: true,
      description:
        'Bucket of the same plan to move the task to (from List Buckets).',
    }),
  },
  async run({ auth, propsValue }) {
    return await microsoft365PlannerApi.patchTask({
      auth,
      taskId: propsValue.taskId,
      fields: { bucketId: propsValue.bucketId },
    });
  },
});
