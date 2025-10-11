import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoft365PlannerAuth, microsoft365PlannerCommon } from '../common';

export const createPlan = createAction({
  auth: microsoft365PlannerAuth,
  name: 'createPlan',
  displayName: 'Create Plan',
  description: 'Create a new planner plan',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the plan',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const planParams = {
      container: {},
      title: propsValue.title,
    };
    return await microsoft365PlannerCommon.createPlan({ auth, ...planParams });
  },
});
