import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoft365PlannerAuth, microsoft365PlannerCommon } from '../common';
import {
  BucketDropdown,
  OrderHintProperty,
  PlanDropdown,
} from '../common/properties';

export const updateBucket = createAction({
  auth: microsoft365PlannerAuth,
  name: 'updateBucket',
  displayName: 'Update Bucket',
  description: 'Modify bucket’s name or properties.',
  props: {
    planId: PlanDropdown({ required: true }),
    id: BucketDropdown({ required: true }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The new name of the bucket',
      required: false,
    }),
    orderHint: OrderHintProperty({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { planId, id, ...updateParams } = propsValue;
    if (!id) {
      throw new Error('Bucket ID is required to update a bucket.');
    }
    return await microsoft365PlannerCommon.updateBucket({
      auth,
      id,
      ...updateParams,
    });
  },
});
