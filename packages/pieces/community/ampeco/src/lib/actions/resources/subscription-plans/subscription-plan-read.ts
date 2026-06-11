import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { SubscriptionPlanReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/subscription-plans/v2.0/{subscriptionPlan}
export const subscriptionPlanReadAction = createAction({
  auth: ampecoAuth,
  name: 'subscriptionPlanRead',
  displayName: 'Resources - Subscription Plans - Read',
  description: 'Get a single subscription plan.',
  audience: 'both',
  aiMetadata: { description: 'Fetch the full details of one AMPECO subscription plan by its numeric ID. Read-only and idempotent. Pick this when you already have a plan ID; to find plans by name or browse all of them, use the subscription plans listing action.', idempotent: true },
  props: {
        
  subscriptionPlan: Property.Number({
    displayName: 'Subscription Plan',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<SubscriptionPlanReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/subscription-plans/v2.0/{subscriptionPlan}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as SubscriptionPlanReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
