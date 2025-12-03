import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ChargePointVendorUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointVendorUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointVendorUpdate',
  displayName: 'Resources - Charge Point Vendors - Charge Point Vendor Update',
  description: 'Charge Point Vendor. (Endpoint: PATCH /public-api/resources/charge-point-vendors/v1.0/{vendorId})',
  props: {
        
  vendorId: Property.Number({
    displayName: 'Vendor Id',
    description: '',
    required: true,
  }),

  name: Property.ShortText({
    displayName: 'Name',
    description: '',
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
