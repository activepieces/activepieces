import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { TransactionReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/transactions/v1.0/{transaction}

export const transactionReadAction = createAction({
  auth: ampecoAuth,
  name: 'transactionRead',
  displayName: 'Resources - Transactions - Read',
  description: 'Get a transation.',
  props: {
        
  transaction: Property.ShortText({
    displayName: 'Transaction',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<TransactionReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/transactions/v1.0/{transaction}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as TransactionReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
