import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { MicrosoftPlannerAuth } from '../common/auth';
export const findPlannerPlan = createAction({
   auth: MicrosoftPlannerAuth,
  name: 'find_planner_plan',
  displayName: 'Find Planner Plan',
  description: 'Retrieve a specific Planner plan by its ID.',

  props: {
    planId: Property.ShortText({
      displayName: 'Plan ID',
      description: 'The ID of the plan to retrieve.',
      required: true,
    }),
  },

  async run(context) {
    const accessToken = (context.auth as { access_token: string }).access_token;
    const { planId } = context.propsValue;

    const url = `/planner/plans/${planId}`;
    const response = await makeRequest(accessToken, HttpMethod.GET, url);
    return {
      success: true,
      message: `Plan with ID ${planId} retrieved successfully.`,
      plan: response,
    };
  },
});
