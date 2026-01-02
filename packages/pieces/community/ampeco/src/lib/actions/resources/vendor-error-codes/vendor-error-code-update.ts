import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { VendorErrorCodeUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const vendorErrorCodeUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'vendorErrorCodeUpdate',
  displayName: 'Resources - Vendor Error Codes - Vendor Error Code Update',
  description: 'Vendor Error Code. (Endpoint: PATCH /public-api/resources/vendor-error-codes/v2.0/{vendorErrorCode})',
  props: {
        
  vendorErrorCode: Property.Number({
    displayName: 'Vendor Error Code',
    description: '',
    required: true,
  }),

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
  async run(context): Promise<VendorErrorCodeUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/vendor-error-codes/v2.0/{vendorErrorCode}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['vendorId', 'errorCode', 'errorCodeDescription', 'errorCodeCustomerAction']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as VendorErrorCodeUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
