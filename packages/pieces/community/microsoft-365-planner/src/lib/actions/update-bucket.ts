import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoft365PlannerAuth } from '../auth';
import { microsoft365PlannerApi } from '../common/api';
import { microsoft365PlannerProps } from '../common/props';
import { microsoft365PlannerSuccessOutputSchema } from '../output-schemas';

export const updateBucketAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'updateBucket',
  outputSchema: microsoft365PlannerSuccessOutputSchema,
  classification: 'WRITE',
  displayName: 'Update Bucket',
  description: 'Modify bucket’s name or properties.',
  audience: 'human',
  aiMetadata: {
    description: 'Updates an existing bucket\'s name and/or order hint, identified by bucket ID within a plan. Use to rename or reorder a bucket. Idempotent: applying the same field values repeatedly leaves the bucket in the same end state.',
    idempotent: true,
  },
  props: {
    planId: microsoft365PlannerProps.planId({ required: true }),
    id: microsoft365PlannerProps.bucketId({ required: true }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The new name of the bucket',
      required: false,
    }),
    orderHint: microsoft365PlannerProps.orderHint({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { planId: _planId, id, ...updateParams } = propsValue;
    if (!id) {
      throw new Error('Bucket ID is required to update a bucket.');
    }
    return await microsoft365PlannerApi.updateBucket({
      auth,
      id,
      ...updateParams,
    });
  },
});
