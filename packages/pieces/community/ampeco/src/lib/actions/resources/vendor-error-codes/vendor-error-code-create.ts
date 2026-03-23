import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { VendorErrorCodeCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/vendor-error-codes/v2.0
export const vendorErrorCodeCreateAction = createAction({
  auth: ampecoAuth,
  name: 'vendorErrorCodeCreate',
  displayName: 'Resources - Vendor Error Codes - Vendor Error Code Create',
  description: 'Create new Vendor Error Code.',
  props: {
        
  vendorId: Property.ShortText({
    displayName: 'Vendor Id',
    description: 'Unique identifier of the Vendor, reported from the Charge point',
    required: true,
  }),

  errorCode: Property.ShortText({
    displayName: 'Error Code',
    description: 'The code reported from the charge point when the hardwareStatus is faulted',
    required: true,
  }),

  errorCodeDescription: Property.ShortText({
    displayName: 'Error Code Description',
    description: 'Description of the error provided by the vendor',
    required: false,
  }),

  errorCodeCustomerAction: Property.ShortText({
    displayName: 'Error Code Customer Action',
    description: 'Recommended actions by the customer when this error occurs',
    required: false,
  }),
  },
  async run(context): Promise<VendorErrorCodeCreateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/vendor-error-codes/v2.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['vendorId', 'errorCode', 'errorCodeDescription', 'errorCodeCustomerAction']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as VendorErrorCodeCreateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
