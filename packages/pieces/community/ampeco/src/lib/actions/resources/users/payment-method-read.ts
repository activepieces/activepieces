import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { PaymentMethodReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const paymentMethodReadAction = createAction({
  auth: ampecoAuth,
  name: 'paymentMethodRead',
  displayName: 'Resources - Users - Payment Method Read',
  description: 'Get information for a payment method by ID. (Endpoint: GET /public-api/resources/users/v1.0/{user}/payment-methods/{paymentMethodId})',
  props: {
        
  user: Property.Number({
    displayName: 'User',
    description: '',
    required: true,
  }),

  paymentMethodId: Property.ShortText({
    displayName: 'Payment Method Id',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<PaymentMethodReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/users/v1.0/{user}/payment-methods/{paymentMethodId}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as PaymentMethodReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
