import { createAction } from '@activepieces/pieces-framework';
import { microsoft365PlannerAuth } from '../auth';
import { microsoft365PlannerApi } from '../common/api';
import { microsoft365PlannerProps } from '../common/props';
import { microsoft365PlannerSuccessOutputSchema } from '../output-schemas';

export const deleteBucketAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'deleteBucket',
  outputSchema: microsoft365PlannerSuccessOutputSchema,
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Bucket',
  description: 'Delete an existing bucket.',
  audience: 'human',
  aiMetadata: {
    description: 'Permanently deletes a bucket from a Planner plan by bucket ID. Use to remove a category and stop grouping tasks under it. Destructive and not idempotent; once removed, repeating the call fails because the bucket no longer exists.',
    idempotent: false,
  },
  props: {
    planId: microsoft365PlannerProps.planId({ required: true }),
    id: microsoft365PlannerProps.bucketId({ required: true }),
  },
  async run({ auth, propsValue: { id } }) {
    if (!id) {
      throw new Error('Bucket id is required');
    }
    return await microsoft365PlannerApi.deleteBucket({
      auth,
      id,
    });
  },
});
