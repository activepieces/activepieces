import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const userAddBalanceAction = createAction({
  auth: ampecoAuth,
  name: 'userAddBalance',
  displayName: 'Actions - Users - User Add Balance',
  description: 'Add to the current balance of the user. (Endpoint: POST /public-api/actions/users/v1.0/{user}/add-balance)',
  props: {
        
  user: Property.Number({
    displayName: 'User',
    description: '',
    required: true,
  }),

  amount: Property.Number({
    displayName: 'Amount',
    description: '',
    required: true,
  }),

  reason: Property.ShortText({
    displayName: 'Reason',
    description: '',
    required: true,
  }),

  app_info: Property.ShortText({
    displayName: 'App Info',
    description: '',
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
