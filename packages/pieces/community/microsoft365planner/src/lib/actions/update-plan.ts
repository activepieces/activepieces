import { createAction, Property } from '@activepieces/pieces-framework';
import { MicrosoftPlannerAuth } from '../common/auth';
import { Client } from '@microsoft/microsoft-graph-client';

export const updatePlan = createAction({
  auth: MicrosoftPlannerAuth,
  name: 'update_plan',
  displayName: 'Update Planner Plan',
  description: 'Update metadata of an existing Planner plan (e.g., title).',

  props: {
    planId: Property.ShortText({
      displayName: 'Plan ID',
      description: 'The ID of the plan you want to update.',
      required: true,
    }),
    etag: Property.ShortText({
      displayName: 'ETag',
      description:
        'The ETag value of the plan. Required for concurrency control. Retrieve it via GET /planner/plans/{planId}.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New title for the plan.',
      required: false,
    }),
  },

  async run(context) {
    const { planId, etag, title } = context.propsValue;

    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () =>
          Promise.resolve((context.auth as { access_token: string }).access_token),
      },
    });

    const payload: Record<string, any> = {};
    if (title) payload['title'] = title;


    const response = await client
      .api(`/planner/plans/${planId}`)
      .header('If-Match', etag)
      .patch(payload);

    return response;
  },
});
