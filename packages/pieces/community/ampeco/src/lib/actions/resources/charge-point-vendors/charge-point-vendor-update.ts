import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { ChargePointVendorUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PATCH /public-api/resources/charge-point-vendors/v1.0/{vendorId}
export const chargePointVendorUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointVendorUpdate',
  displayName: 'Resources - Charge Point Vendors - Update',
  description: 'Charge Point Vendor.',
  props: {
        
  vendorId: Property.Number({
    displayName: 'Vendor Id',
    required: true,
  }),

  name: Property.ShortText({
    displayName: 'Name',
    required: false,
  }),
  },
  async run(context): Promise<ChargePointVendorUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-point-vendors/v1.0/{vendorId}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['name']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as ChargePointVendorUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
