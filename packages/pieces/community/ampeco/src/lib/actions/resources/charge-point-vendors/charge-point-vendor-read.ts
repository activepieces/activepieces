import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ChargePointVendorReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointVendorReadAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointVendorRead',
  displayName: 'Resources - Charge Point Vendors - Charge Point Vendor Read',
  description: 'Get a Charge Point Vendor. (Endpoint: GET /public-api/resources/charge-point-vendors/v1.0/{vendorId})',
  props: {
        
  vendorId: Property.Number({
    displayName: 'Vendor Id',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<ChargePointVendorReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-point-vendors/v1.0/{vendorId}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ChargePointVendorReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
