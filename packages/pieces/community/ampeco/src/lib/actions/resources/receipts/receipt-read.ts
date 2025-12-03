import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ReceiptReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const receiptReadAction = createAction({
  auth: ampecoAuth,
  name: 'receiptRead',
  displayName: 'Resources - Receipts - Receipt Read',
  description: 'Get a single receipt. (Endpoint: GET /public-api/resources/receipts/v2.0/{receipt})',
  props: {
        
  receipt: Property.Number({
    displayName: 'Receipt',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<ReceiptReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/receipts/v2.0/{receipt}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ReceiptReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
