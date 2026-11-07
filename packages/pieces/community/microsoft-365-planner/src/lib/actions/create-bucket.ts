import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoft365PlannerAuth } from '../auth';
import { microsoft365PlannerApi } from '../common/api';
import { microsoft365PlannerProps } from '../common/props';
import { microsoft365PlannerBucketOutputSchema } from '../output-schemas';

export const createBucketAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'createBucket',
  outputSchema: microsoft365PlannerBucketOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Bucket',
  description: 'Create a bucket (category) under a plan.',
  audience: 'human',
  aiMetadata: {
    description: 'Creates a new bucket (a column/category for grouping tasks) under an existing Planner plan, identified by plan ID. Use to organize tasks within a plan. Each call adds another bucket, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    planId: microsoft365PlannerProps.planId({ required: true }),
    name: Property.ShortText({
      displayName: 'Bucket Name',
      description: 'The name of the bucket to be created',
      required: true,
    }),
    orderHint: microsoft365PlannerProps.orderHint({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await microsoft365PlannerApi.createBucket({
      auth,
      ...propsValue,
    });
  },
});
