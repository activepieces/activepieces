import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { ChargePointVendorCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/charge-point-vendors/v1.0

export const chargePointVendorCreateAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointVendorCreate',
  displayName: 'Resources - Charge Point Vendors - Create',
  description: 'Create new Charge Point Vendor.',
  audience: 'both',
  aiMetadata: { description: 'Create a new AMPECO charge-point vendor (manufacturer) with the given name. Not idempotent: each call creates a separate vendor record, so guard against duplicate names. Use the update action to rename an existing vendor.', idempotent: false },
  props: {
        
  name: Property.ShortText({
    displayName: 'Name',
    required: true,
  }),
  },
  async run(context): Promise<ChargePointVendorCreateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-point-vendors/v1.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['name']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as ChargePointVendorCreateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
