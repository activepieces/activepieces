import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoft365PlannerAuth, microsoft365PlannerCommon } from '../common';
import { OrderHintProperty, PlanDropdown } from '../common/properties';

export const createBucket = createAction({
  auth: microsoft365PlannerAuth,
  name: 'createBucket',
  displayName: 'Create Bucket',
  description: 'Create a bucket (category) under a plan.',
  audience: 'both',
  aiMetadata: {
    description: 'Creates a new bucket (a column/category for grouping tasks) under an existing Planner plan, identified by plan ID. Use to organize tasks within a plan. Each call adds another bucket, so it is not idempotent.',
    idempotent: false,
  },
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
