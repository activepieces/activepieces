import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ReceiptReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/receipts/v2.0/{receipt}

export const receiptReadAction = createAction({
  auth: ampecoAuth,
  name: 'receiptRead',
  displayName: 'Resources - Receipts - Receipt Read',
  description: 'Get a single receipt.',
  audience: 'both',
  aiMetadata: { description: 'Fetch one receipt by its numeric ID. Read-only and safe to repeat. To find receipts when you do not know the ID (e.g. by user, tax ID, payment status, or period) use receipts-listing instead.', idempotent: true },
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
