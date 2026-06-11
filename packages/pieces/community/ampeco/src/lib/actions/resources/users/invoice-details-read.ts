import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { InvoiceDetailsReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/users/v1.0/{user}/invoice-details

export const invoiceDetailsReadAction = createAction({
  auth: ampecoAuth,
  name: 'invoiceDetailsRead',
  displayName: 'Resources - Users - Invoice Details Read',
  description: 'Invoice details / Read.',
  audience: 'both',
  aiMetadata: { description: 'Fetch the stored billing/invoice details for a single AMPECO user, identified by user id. Read-only and idempotent. Use to inspect current invoice settings before changing them with Invoice Details Create Or Update.', idempotent: true },
  props: {
        
  user: Property.Number({
    displayName: 'User',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<InvoiceDetailsReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/users/v1.0/{user}/invoice-details', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as InvoiceDetailsReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
