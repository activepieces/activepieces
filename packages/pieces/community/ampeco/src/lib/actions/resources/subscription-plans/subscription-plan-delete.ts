import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/subscription-plans/v2.0/{subscriptionPlan}

export const subscriptionPlanDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'subscriptionPlanDelete',
  displayName: 'Resources - Subscription Plans - Delete',
  description: 'Delete a Subscription plan.',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete an AMPECO subscription plan by its numeric ID. Destructive; deleting an already-removed plan returns an error rather than succeeding silently. Use the listing action first to confirm the correct plan ID.', idempotent: false },
  props: {
        
  subscriptionPlan: Property.Number({
    displayName: 'Subscription Plan',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/subscription-plans/v2.0/{subscriptionPlan}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.DELETE,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
