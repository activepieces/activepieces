import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { VendorErrorCodeReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/vendor-error-codes/v2.0/{vendorErrorCode}
export const vendorErrorCodeReadAction = createAction({
  auth: ampecoAuth,
  name: 'vendorErrorCodeRead',
  displayName: 'Resources - Vendor Error Codes - Vendor Error Code Read',
  description: 'Get a Vendor Error Code.',
  props: {
        
  vendorErrorCode: Property.Number({
    displayName: 'Vendor Error Code',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<VendorErrorCodeReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/vendor-error-codes/v2.0/{vendorErrorCode}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as VendorErrorCodeReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
