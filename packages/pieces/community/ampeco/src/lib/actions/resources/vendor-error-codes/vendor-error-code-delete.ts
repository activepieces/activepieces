import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/vendor-error-codes/v2.0/{vendorErrorCode}
export const vendorErrorCodeDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'vendorErrorCodeDelete',
  displayName: 'Resources - Vendor Error Codes - Vendor Error Code Delete',
  description: 'Delete a Vendor Error Code.',
  props: {
        
  vendorErrorCode: Property.Number({
    displayName: 'Vendor Error Code',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/vendor-error-codes/v2.0/{vendorErrorCode}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.DELETE,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
