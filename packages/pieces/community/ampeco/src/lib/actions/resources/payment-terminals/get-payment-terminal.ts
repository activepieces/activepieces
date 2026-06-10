import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { GetPaymentTerminalResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/payment-terminals/v1.0/{paymentTerminal}

export const getPaymentTerminalAction = createAction({
  auth: ampecoAuth,
  name: 'getPaymentTerminal',
  displayName: 'Resources - Payment Terminals - Get Payment Terminal',
  description: 'Get information for a payment terminal by ID.',
  props: {
        
  paymentTerminal: Property.ShortText({
    displayName: 'Payment Terminal',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<GetPaymentTerminalResponse> {
    try {
      const url = processPathParameters('/public-api/resources/payment-terminals/v1.0/{paymentTerminal}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as GetPaymentTerminalResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
