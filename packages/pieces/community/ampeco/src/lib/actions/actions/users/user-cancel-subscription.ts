import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/users/v1.0/{user}/cancel-subscription
export const userCancelSubscriptionAction = createAction({
  auth: ampecoAuth,
  name: 'userCancelSubscription',
  displayName: 'Actions - Users - Cancel Subscription',
  description: 'Cancel a subscription to a user.',
  props: {
        
  user: Property.Number({
    displayName: 'User',
    required: true,
  }),

  reason: Property.ShortText({
    displayName: 'Reason',
    description: 'The reason for the cancellation. It would be included in the Audit logs.',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/users/v1.0/{user}/cancel-subscription', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['reason']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
