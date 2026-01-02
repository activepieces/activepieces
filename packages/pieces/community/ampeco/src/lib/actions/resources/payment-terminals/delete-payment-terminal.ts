import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const deletePaymentTerminalAction = createAction({
  auth: ampecoAuth,
  name: 'deletePaymentTerminal',
  displayName: 'Resources - Payment Terminals - Delete Payment Terminal',
  description: 'Delete a payment terminal. (Endpoint: DELETE /public-api/resources/payment-terminals/v1.0/{paymentTerminal})',
  props: {
        
  paymentTerminal: Property.ShortText({
    displayName: 'Payment Terminal',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/payment-terminals/v1.0/{paymentTerminal}', context.propsValue);
      
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
