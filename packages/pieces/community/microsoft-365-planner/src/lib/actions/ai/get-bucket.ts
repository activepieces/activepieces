import { createAction } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../../auth';
import { microsoft365PlannerAiProps } from '../../common/ai-props';
import { microsoft365PlannerApi } from '../../common/api';
import { microsoft365PlannerBucketOutputSchema } from '../../output-schemas';

export const getBucketAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'microsoft_365_planner_get_bucket',
  outputSchema: microsoft365PlannerBucketOutputSchema,
  displayName: 'Get Bucket',
  description: 'Gets a Planner bucket by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one Planner bucket by its Bucket ID (from List Buckets): name, plan ID and order hint.',
    idempotent: true,
  },
  props: {
    bucketId: microsoft365PlannerAiProps.bucketId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await microsoft365PlannerApi.getBucket({
      auth,
      bucketId: propsValue.bucketId,
    });
  },
});
