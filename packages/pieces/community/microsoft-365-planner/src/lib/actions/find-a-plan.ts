import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoft365PlannerAuth, microsoft365PlannerCommon } from '../common';

export const findAPlan = createAction({
  auth: microsoft365PlannerAuth,
  name: 'findAPlan',
  displayName: 'Find a Plan',
  description: 'Finds a plan by field.',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the plan to search for',
      required: true,
    }),
  },
  async run({ auth, propsValue: { title } }) {
    const plans = await microsoft365PlannerCommon.listPlans({ auth });
    return plans.filter(
      (plan) =>
        plan.title && plan.title.toLowerCase().includes(title.toLowerCase())
    );
  },
});
