import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/users/v1.0/{user}/add-balance
export const userAddBalanceAction = createAction({
  auth: ampecoAuth,
  name: 'userAddBalance',
  displayName: 'Actions - Users - Add Balance',
  description: 'Add to the current balance of the user.',
  audience: 'both',
  aiMetadata: { description: "Credit (or debit, with a negative amount) a user's account balance by the given amount, recording the required reason. Not idempotent: this adds to the existing balance, so each call shifts it further rather than setting an absolute value.", idempotent: false },
  props: {
        
  user: Property.Number({
    displayName: 'User',
    required: true,
  }),

  amount: Property.Number({
    displayName: 'Amount',
    required: true,
  }),

  reason: Property.ShortText({
    displayName: 'Reason',
    required: true,
  }),

  app_info: Property.ShortText({
    displayName: 'App Info',
    required: false,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/users/v1.0/{user}/add-balance', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['amount', 'reason', 'app_info']
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
