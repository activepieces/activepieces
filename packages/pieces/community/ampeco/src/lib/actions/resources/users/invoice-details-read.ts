import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { InvoiceDetailsReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const invoiceDetailsReadAction = createAction({
  auth: ampecoAuth,
  name: 'invoiceDetailsRead',
  displayName: 'Resources - Users - Invoice Details Read',
  description: 'Invoice details / Read. (Endpoint: GET /public-api/resources/users/v1.0/{user}/invoice-details)',
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
