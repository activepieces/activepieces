import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { PaymentMethodCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/users/v1.0/{user}/payment-methods

export const paymentMethodCreateAction = createAction({
  auth: ampecoAuth,
  name: 'paymentMethodCreate',
  displayName: 'Resources - Users - Payment Method Create',
  description: 'Initiate a new payment method registration, or finalize it. Note that this is a two step process! # For payment processors with web view integration You will need to initiate a call with no parameters to this endpoint to get a new request to add payment method (Step 1). Then you will have to redirect to an endpoint and wait for the client to enter his credit card details there.',
  props: {
        
  user: Property.Number({
    displayName: 'User',
    description: '',
    required: true,
  }),

  tokenizedType: Property.StaticDropdown({
    displayName: 'Tokenized Type',
    description: 'The type of the tokenized payment method. If not provided - defaults to card',
    required: false,
    options: {
      options: [
      { label: 'card', value: 'card' },
      { label: 'bank_transfer', value: 'bank_transfer' }
      ],
    },
  }),

  bankTransferType: Property.StaticDropdown({
    displayName: 'Bank Transfer Type',
    description: 'The type of the bank transfer. Required if `tokenizedType` is `bank_transfer`',
    required: false,
    options: {
      options: [
      { label: 'sepa', value: 'sepa' }
      ],
    },
  }),

  transactionId: Property.Number({
    displayName: 'Transaction Id',
    description: 'The ID of the Transaction object, created when you initiated the request.',
    required: false,
  }),
  },
  async run(context): Promise<PaymentMethodCreateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/users/v1.0/{user}/payment-methods', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['tokenizedType', 'bankTransferType', 'transactionId']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as PaymentMethodCreateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
