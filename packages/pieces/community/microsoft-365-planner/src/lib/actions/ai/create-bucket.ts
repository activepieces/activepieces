import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../../auth';
import { microsoft365PlannerAiProps } from '../../common/ai-props';
import { microsoft365PlannerApi } from '../../common/api';
import { microsoft365PlannerBucketOutputSchema } from '../../output-schemas';

export const createBucketAiAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'microsoft_365_planner_create_bucket',
  outputSchema: microsoft365PlannerBucketOutputSchema,
  displayName: 'Create Bucket',
  description: 'Creates a bucket in a Planner plan.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a new bucket (column) in a Planner plan (Plan ID from List Plans). Each call creates another bucket, even with the same name.',
    idempotent: false,
  },
  props: {
    planId: microsoft365PlannerAiProps.planId({ required: true }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the new bucket.',
      required: true,
    }),
    orderHint: Property.ShortText({
      displayName: 'Order Hint',
      description:
        'Optional Planner order hint that positions the bucket, e.g. " !" to put it first. Leave empty to add it at the end.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await microsoft365PlannerApi.createBucket({
      auth,
      planId: propsValue.planId,
      name: propsValue.name,
      orderHint: propsValue.orderHint,
    });
  },
});
