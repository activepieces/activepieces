import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { TransactionUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PATCH /public-api/resources/transactions/v1.0/{transaction}

export const transactionUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'transactionUpdate',
  displayName: 'Resources - Transactions - Update',
  description: 'Update a non-finalised transaction.',
  props: {
        
  transaction: Property.ShortText({
    displayName: 'Transaction',
    description: '',
    required: true,
  }),

  paymentMethod__methodType: Property.StaticDropdown({
    displayName: 'Payment Method - Method Type',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'card', value: 'card' },
      { label: 'bank_transfer', value: 'bank_transfer' }
      ],
    },
  }),

  paymentMethod__cardNetwork: Property.StaticDropdown({
    displayName: 'Payment Method - Card Network',
    description: 'Required when `methodType` is `card`.',
    required: false,
    options: {
      options: [
      { label: 'visa', value: 'visa' },
      { label: 'mastercard', value: 'mastercard' },
      { label: 'paypal', value: 'paypal' },
      { label: 'maestro', value: 'maestro' },
      { label: 'amex', value: 'amex' },
      { label: 'unknown', value: 'unknown' }
      ],
    },
  }),

  paymentMethod__bankTransferType: Property.StaticDropdown({
    displayName: 'Payment Method - Bank Transfer Type',
    description: 'Required when `methodType` is `bank_transfer`.',
    required: false,
    options: {
      options: [
      { label: 'pse', value: 'pse' },
      { label: 'sepa', value: 'sepa' }
      ],
    },
  }),

  paymentMethod__type: Property.StaticDropdown({
    displayName: 'Payment Method - Type',
    description: 'Deprecated, please use `methodType` and `cardNetwork` instead.',
    required: false,
    options: {
      options: [
      { label: 'visa', value: 'visa' },
      { label: 'mastercard', value: 'mastercard' },
      { label: 'paypal', value: 'paypal' },
      { label: 'maestro', value: 'maestro' },
      { label: 'amex', value: 'amex' },
      { label: 'unknown', value: 'unknown' }
      ],
    },
  }),

  paymentMethod__last4: Property.ShortText({
    displayName: 'Payment Method - Last4',
    description: '',
    required: false,
  }),

  paymentMethod__expMonth: Property.ShortText({
    displayName: 'Payment Method - Exp Month',
    description: '',
    required: false,
  }),

  paymentMethod__expYear: Property.ShortText({
    displayName: 'Payment Method - Exp Year',
    description: '',
    required: false,
  }),

  status: Property.StaticDropdown({
    displayName: 'Status',
    description: '',
    required: true,
    options: {
      options: [
      { label: 'pending', value: 'pending' },
      { label: 'finalized', value: 'finalized' },
      { label: 'failed', value: 'failed' },
      { label: 'reversed', value: 'reversed' },
      { label: 'refunded', value: 'refunded' },
      { label: 'authorized', value: 'authorized' },
      { label: 'initialized', value: 'initialized' }
      ],
    },
  }),

  totalAmount: Property.Number({
    displayName: 'Total Amount',
    description: '',
    required: true,
  }),

  ref: Property.ShortText({
    displayName: 'Ref',
    description: '',
    required: false,
  }),

  failureReason: Property.ShortText({
    displayName: 'Failure Reason',
    description: '',
    required: false,
  }),
  },
  async run(context): Promise<TransactionUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/transactions/v1.0/{transaction}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['paymentMethod', 'status', 'totalAmount', 'ref', 'failureReason']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as TransactionUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
