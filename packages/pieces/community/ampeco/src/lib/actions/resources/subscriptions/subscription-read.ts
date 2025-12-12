import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { SubscriptionReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const subscriptionReadAction = createAction({
  auth: ampecoAuth,
  name: 'subscriptionRead',
  displayName: 'Resources - Subscriptions - Subscription Read',
  description: 'Get a single subscription. (Endpoint: GET /public-api/resources/subscriptions/v1.0/{subscription})',
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
