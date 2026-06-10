import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ChargePointVendorReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/charge-point-vendors/v1.0/{vendorId}

export const chargePointVendorReadAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointVendorRead',
  displayName: 'Resources - Charge Point Vendors - Read',
  description: 'Get a Charge Point Vendor.',
  props: {
        
  vendorId: Property.Number({
    displayName: 'Vendor Id',
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
