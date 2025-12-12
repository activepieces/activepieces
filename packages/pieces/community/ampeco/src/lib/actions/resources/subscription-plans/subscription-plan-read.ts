import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { SubscriptionPlanReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const subscriptionPlanReadAction = createAction({
  auth: ampecoAuth,
  name: 'subscriptionPlanRead',
  displayName: 'Resources - Subscription Plans - Subscription Plan Read',
  description: 'Get a single subscription plan. (Endpoint: GET /public-api/resources/subscription-plans/v2.0/{subscriptionPlan})',
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
