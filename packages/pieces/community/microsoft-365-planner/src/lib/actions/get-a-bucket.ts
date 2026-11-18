import { createAction } from '@activepieces/pieces-framework';
import { microsoft365PlannerAuth } from '../auth';
import { microsoft365PlannerApi } from '../common/api';
import { microsoft365PlannerProps } from '../common/props';
import { microsoft365PlannerBucketOutputSchema } from '../output-schemas';

export const getABucketAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'getABucket',
  outputSchema: microsoft365PlannerBucketOutputSchema,
  classification: 'READ',
  displayName: 'Get a Bucket',
  description: 'Retrieve details about a specific bucket.',
  audience: 'human',
  aiMetadata: {
    description: 'Retrieves the details of a single Planner bucket by its bucket ID (within a known plan). Use to inspect a bucket\'s current name and order hint. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    planId: microsoft365PlannerProps.planId({ required: true }),
    bucketId: microsoft365PlannerProps.bucketId({ required: true }),
  },
  async run({ auth, propsValue: { bucketId } }) {
    if (!bucketId) {
      throw new Error('Bucket ID is required to fetch bucket details.');
    }
    return await microsoft365PlannerApi.getBucket({
      auth,
      bucketId,
    });
  },
});
