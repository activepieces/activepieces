import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../../auth';
import { microsoft365PlannerAiProps } from '../../common/ai-props';
import { microsoft365PlannerApi } from '../../common/api';
import { microsoft365PlannerBucketOutputSchema } from '../../output-schemas';

export const updateBucketAiAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'microsoft_365_planner_update_bucket',
  outputSchema: microsoft365PlannerBucketOutputSchema,
  displayName: 'Update Bucket',
  description: 'Renames or reorders a Planner bucket.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes a Planner bucket’s name and/or order hint (Bucket ID from List Buckets) and returns the updated bucket. Only the fields you set change.',
    idempotent: true,
  },
  props: {
    bucketId: microsoft365PlannerAiProps.bucketId({ required: true }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New name of the bucket.',
      required: false,
    }),
    orderHint: Property.ShortText({
      displayName: 'Order Hint',
      description: 'New Planner order hint, e.g. " !" to move it first.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { name, orderHint } = propsValue;
    if (name === undefined && orderHint === undefined) {
      throw new Error('Set Name or Order Hint.');
    }
    return await microsoft365PlannerApi.patchBucket({
      auth,
      bucketId: propsValue.bucketId,
      fields: {
        ...(name !== undefined ? { name } : {}),
        ...(orderHint !== undefined ? { orderHint } : {}),
      },
    });
  },
});
