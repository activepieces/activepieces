import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/users/v1.0/{user}/apply-custom-fee
export const userApplyCustomFeeAction = createAction({
  auth: ampecoAuth,
  name: 'userApplyCustomFee',
  displayName: 'Actions - Users - Apply Custom Fee',
  description: 'Apply custom fee for a user.',
  props: {
        
  user: Property.Number({
    displayName: 'User',
    required: true,
  }),

  amount: Property.Number({
    displayName: 'Amount',
    required: true,
  }),

  description: Property.ShortText({
    displayName: 'Description',
    description: 'Shown to the user and also added to the user\'s bank statement (if the payment method is a bank card).',
    required: true,
  }),

  paymentMethodId: Property.ShortText({
    displayName: 'Payment Method Id',
    description: 'The ID of the payment method, as returned by the payment method listing (User / Payment Method / Listing). When left empty or null, it would take the balance and if the balance is insufficient, would reject the action. Corporate billing is not supported as a payment method.',
    required: false,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/users/v1.0/{user}/apply-custom-fee', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['amount', 'description', 'paymentMethodId']
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
