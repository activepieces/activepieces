import { createAction } from '@activepieces/pieces-framework';
import { microsoft365PlannerAuth, microsoft365PlannerCommon } from '../common';
import { BucketDropdown, PlanDropdown } from '../common/properties';

export const deleteBucket = createAction({
  auth: microsoft365PlannerAuth,
  name: 'deleteBucket',
  displayName: 'Delete Bucket',
  description: 'Delete an existing bucket.',
  props: {
    planId: PlanDropdown({ required: true }),
    id: BucketDropdown({ required: true }),
  },
  async run({ auth, propsValue: { id } }) {
    if (!id) {
      throw new Error('Bucket id is required');
    }
    return await microsoft365PlannerCommon.deleteBucket({
      auth,
      id,
    });
  },
});
