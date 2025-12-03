import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const subscriptionPlanDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'subscriptionPlanDelete',
  displayName: 'Resources - Subscription Plans - Subscription Plan Delete',
  description: 'Delete a Subscription plan. (Endpoint: DELETE /public-api/resources/subscription-plans/v2.0/{subscriptionPlan})',
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
