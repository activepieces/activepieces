import { createAction } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../../auth';
import { microsoft365PlannerAiProps } from '../../common/ai-props';
import { microsoft365PlannerApi } from '../../common/api';
import { microsoft365PlannerDeletedOutputSchema } from '../../output-schemas';

export const deleteBucketAiAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'microsoft_365_planner_delete_bucket',
  outputSchema: microsoft365PlannerDeletedOutputSchema,
  displayName: 'Delete Bucket',
  description: 'Permanently deletes a Planner bucket.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a Planner bucket (Bucket ID from List Buckets) and the tasks in it. Cannot be undone; repeating the call fails because the bucket no longer exists.',
    idempotent: false,
  },
  props: {
    bucketId: microsoft365PlannerAiProps.bucketId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await microsoft365PlannerApi.deleteBucket({
      auth,
      id: propsValue.bucketId,
    });
    return { success: true, id: propsValue.bucketId };
  },
});
