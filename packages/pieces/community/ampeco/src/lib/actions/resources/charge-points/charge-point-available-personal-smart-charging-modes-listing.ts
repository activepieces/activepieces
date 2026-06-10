import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ChargePointAvailablePersonalSmartChargingModesListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/charge-points/v2.0/{chargePoint}/available-personal-smart-charging-modes
export const chargePointAvailablePersonalSmartChargingModesListingAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointAvailablePersonalSmartChargingModesListing',
  displayName: 'Resources - Charge Points - Available Personal Smart Charging Modes Listing',
  description: 'Get all available personal smart charging modes.',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    required: true,
  }),
  },
  async run(context): Promise<ChargePointAvailablePersonalSmartChargingModesListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-points/v2.0/{chargePoint}/available-personal-smart-charging-modes', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ChargePointAvailablePersonalSmartChargingModesListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
