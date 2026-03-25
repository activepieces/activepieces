import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/users/v1.0/{user}/payment-methods/{paymentMethodId}

export const paymentMethodDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'paymentMethodDelete',
  displayName: 'Resources - Users - Payment Method Delete',
  description: 'Delete Payment method. Please note that ";balance"; and ";corporate"; payment methods CANNOT be removed from this interface.',
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
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/users/v1.0/{user}/payment-methods/{paymentMethodId}', context.propsValue);
      
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
