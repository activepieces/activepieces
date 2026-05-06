import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { InvoiceReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/invoices/v1.0/{invoice}

export const invoiceReadAction = createAction({
  auth: ampecoAuth,
  name: 'invoiceRead',
  displayName: 'Resources - Invoices - Read',
  description: 'Invoice / Read.',
  props: {
        
  invoice: Property.ShortText({
    displayName: 'Invoice',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<InvoiceReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/invoices/v1.0/{invoice}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as InvoiceReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
