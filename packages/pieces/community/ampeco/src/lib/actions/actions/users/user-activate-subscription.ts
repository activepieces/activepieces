import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/users/v1.0/{user}/activate-subscription
export const userActivateSubscriptionAction = createAction({
  auth: ampecoAuth,
  name: 'userActivateSubscription',
  displayName: 'Actions - Users - Activate Subscription',
  description: 'Activate a subscription to a user.',
  props: {
        
  user: Property.Number({
    displayName: 'User',
    required: true,
  }),

  planId: Property.Number({
    displayName: 'Plan Id',
    required: true,
  }),

  endDate: Property.DateTime({
    displayName: 'End Date',
    description: 'The subscription will be valid until this end date',
    required: false,
  }),

  autoRenewal: Property.StaticDropdown({
    displayName: 'Auto Renewal',
    description: 'Enable the auto-renewal of the subscription after the end date',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  reason: Property.ShortText({
    displayName: 'Reason',
    description: 'In case reason is empty, following text "Activated via API" will be added automatically',
    required: false,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/users/v1.0/{user}/activate-subscription', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['planId', 'endDate', 'autoRenewal', 'reason']
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
