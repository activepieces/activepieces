import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const userClearSubscriptionAmountDueAction = createAction({
  auth: ampecoAuth,
  name: 'userClearSubscriptionAmountDue',
  displayName: 'Actions - Users - User Clear Subscription Amount Due',
  description: 'Clear a user&#x27;s subscription amount due. Any unsettled transactions related to the user&#x27;s current subscription — such as fees and charging sessions will be set to an amount of 0.This operation is irreversible. (Endpoint: POST /public-api/actions/users/v1.0/{user}/clear-subscription-amount-due)',
  props: {
        
  user: Property.Number({
    displayName: 'User',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/users/v1.0/{user}/clear-subscription-amount-due', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
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
