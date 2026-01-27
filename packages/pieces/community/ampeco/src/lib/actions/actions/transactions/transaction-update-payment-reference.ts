import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

//  Endpoint: POST /public-api/actions/transactions/v1.0/{transaction}/update-payment-reference
export const transactionUpdatePaymentReferenceAction = createAction({
  auth: ampecoAuth,
  name: 'transactionUpdatePaymentReference',
  displayName: 'Actions - Transactions - Update Payment Reference',
  description: 'Link the transaction to external resource where the payment took place.',
  props: {
        
  transaction: Property.Number({
    displayName: 'Transaction',
    required: true,
  }),

  ref: Property.ShortText({
    displayName: 'Ref',
    description: 'Reference to the payment processor or payment terminal where more information about the transaction could be checked.',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/transactions/v1.0/{transaction}/update-payment-reference', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['ref']
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
