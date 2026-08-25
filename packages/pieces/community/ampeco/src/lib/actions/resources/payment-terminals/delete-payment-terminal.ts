import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/payment-terminals/v1.0/{paymentTerminal}

export const deletePaymentTerminalAction = createAction({
  auth: ampecoAuth,
  name: 'deletePaymentTerminal',
  displayName: 'Resources - Payment Terminals - Delete Payment Terminal',
  description: 'Delete a payment terminal.',
  audience: 'both',
  aiMetadata: { description: 'Permanently remove a payment terminal identified by its id. Destructive but idempotent: once deleted, repeating the call has no further effect (the terminal is already gone). Use getPaymentTerminal first to confirm you have the right terminal.', idempotent: true },
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
