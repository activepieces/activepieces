import { createAction } from '@activepieces/pieces-framework';
import { microsoft365PlannerAuth, microsoft365PlannerCommon } from '../common';
import { BucketDropdown, PlanDropdown } from '../common/properties';

export const getABucket = createAction({
  auth: microsoft365PlannerAuth,
  name: 'getABucket',
  displayName: 'Get a Bucket',
  description: 'Retrieve details about a specific bucket.',
  props: {
    planId: PlanDropdown({ required: true }),
    bucketId: BucketDropdown({ required: true }),
  },
  async run({ auth, propsValue: { bucketId } }) {
    if (!bucketId) {
      throw new Error('Bucket ID is required to fetch bucket details.');
    }
    return await microsoft365PlannerCommon.getBucketDetails({
      auth,
      bucketId,
    });
  },
});
