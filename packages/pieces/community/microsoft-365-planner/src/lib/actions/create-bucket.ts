import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoft365PlannerAuth, microsoft365PlannerCommon } from '../common';
import { OrderHintProperty, PlanDropdown } from '../common/properties';

export const createBucket = createAction({
  auth: microsoft365PlannerAuth,
  name: 'createBucket',
  displayName: 'Create Bucket',
  description: 'Create a bucket (category) under a plan.',
  props: {
    planId: PlanDropdown({ required: true }),
    name: Property.ShortText({
      displayName: 'Bucket Name',
      description: 'The name of the bucket to be created',
      required: true,
    }),
    orderHint: OrderHintProperty({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await microsoft365PlannerCommon.createBucket({
      auth,
      ...propsValue,
    });
  },
});
