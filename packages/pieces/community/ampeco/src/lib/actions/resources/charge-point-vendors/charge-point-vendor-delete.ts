import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointVendorDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointVendorDelete',
  displayName: 'Resources - Charge Point Vendors - Charge Point Vendor Delete',
  description: 'Delete a Charge Point Vendor. (Endpoint: DELETE /public-api/resources/charge-point-vendors/v1.0/{vendorId})',
  props: {
        
  vendorId: Property.Number({
    displayName: 'Vendor Id',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/charge-point-vendors/v1.0/{vendorId}', context.propsValue);
      
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
