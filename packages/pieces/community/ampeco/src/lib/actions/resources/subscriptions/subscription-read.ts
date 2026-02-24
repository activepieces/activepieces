import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { SubscriptionReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/subscriptions/v1.0/{subscription}
export const subscriptionReadAction = createAction({
  auth: ampecoAuth,
  name: 'subscriptionRead',
  displayName: 'Resources - Subscriptions - Subscription Read',
  description: 'Get a single subscription.',
  props: {
        
  subscription: Property.Number({
    displayName: 'Subscription',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<SubscriptionReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/subscriptions/v1.0/{subscription}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as SubscriptionReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
