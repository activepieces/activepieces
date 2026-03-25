import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/charge-point-vendors/v1.0/{vendorId}
export const chargePointVendorDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointVendorDelete',
  displayName: 'Resources - Charge Point Vendors - Delete',
  description: 'Delete a Charge Point Vendor.',
  props: {
        
  vendorId: Property.Number({
    displayName: 'Vendor Id',
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
