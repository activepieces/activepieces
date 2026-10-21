import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoft365PlannerAuth } from '../auth';
import { microsoft365PlannerApi } from '../common/api';
import { microsoft365PlannerFindPlanOutputSchema } from '../output-schemas';

export const findAPlanAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'findAPlan',
  outputSchema: microsoft365PlannerFindPlanOutputSchema,
  classification: 'SEARCH',
  displayName: 'Find a Plan',
  description: 'Finds a plan by field.',
  audience: 'human',
  aiMetadata: {
    description: 'Searches across the authenticated user\'s Planner plans and returns those whose title contains the given text (case-insensitive substring match). Use to resolve a plan name into its plan ID before acting on it. Read-only and idempotent; the title input is required.',
    idempotent: true,
  },
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the plan to search for',
      required: true,
    }),
  },
  async run({ auth, propsValue: { title } }) {
    const plans = await microsoft365PlannerApi.listPlans({ auth });
    return plans.filter(
      (plan) =>
        plan.title && plan.title.toLowerCase().includes(title.toLowerCase())
    );
  },
});
