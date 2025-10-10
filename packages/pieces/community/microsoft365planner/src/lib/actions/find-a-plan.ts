import { createAction, Property } from '@activepieces/pieces-framework';
import { MicrosoftPlannerAuth } from '../common/auth';
import { Client } from '@microsoft/microsoft-graph-client';
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
    const { planId } = context.propsValue;
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () =>
          Promise.resolve((context.auth as { access_token: string }).access_token),
      },
    });

    const response = await client
      .api(`/planner/plans/${planId}`)
      .get();

    return response;
  },
});
