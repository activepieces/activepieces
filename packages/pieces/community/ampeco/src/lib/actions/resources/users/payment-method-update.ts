import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { PaymentMethodUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// (Endpoint: PATCH /public-api/resources/users/v1.0/{user}/payment-methods/{paymentMethodId})

export const paymentMethodUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'paymentMethodUpdate',
  displayName: 'Resources - Users - Payment Method Update',
  description: 'Update Payment method. Please note that ";balance"; and ";corporate"; payment methods CANNOT be set as default',
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

  default: Property.StaticDropdown({
    displayName: 'Default',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),
  },
  async run(context): Promise<PaymentMethodUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/users/v1.0/{user}/payment-methods/{paymentMethodId}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['default']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as PaymentMethodUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
