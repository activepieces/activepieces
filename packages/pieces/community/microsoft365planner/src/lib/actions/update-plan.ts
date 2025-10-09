import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { MicrosoftPlannerAuth } from '../common/auth';

export const updatePlan = createAction({
  auth:MicrosoftPlannerAuth,
  name: 'update_plan',
  displayName: 'Update Planner Plan',
  description: 'Update metadata of an existing Planner plan',

  props: {
    planId: Property.ShortText({
      displayName: 'Plan ID',
      description: 'The ID of the plan you want to update.',
      required: true,
    }),
    etag: Property.ShortText({
      displayName: 'ETag',
      description:
        'The ETag value of the plan. Required for concurrency. Retrieve it via GET /planner/plans/{planId}.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New title for the plan.',
      required: false,
    }),

  },

  async run(context) {
    const accessToken = (context.auth as { access_token: string }).access_token;
    const { planId, etag, title, } = context.propsValue;

    const payload: Record<string, any> = {};
    if (title) payload['title'] = title;

    const response = await makeRequest(
      accessToken,
      HttpMethod.PATCH,
      `/planner/plans/${planId}`,
      payload,
      {
        'If-Match': etag,
      }
    );

    return {
      success: true,
      message: `Plan with ID ${planId} updated successfully.`,
      response,
    };
  },
});
