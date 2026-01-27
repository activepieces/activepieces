import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { LocationChargingZoneReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/locations/v2.0/{location}/charging-zones/{chargingZone}

export const locationChargingZoneReadAction = createAction({
  auth: ampecoAuth,
  name: 'locationChargingZoneRead',
  displayName: 'Resources - Locations - Read Charging Zone',
  description: 'Get a Charging Zone.',
  props: {
        
  location: Property.Number({
    displayName: 'Location',
    description: '',
    required: true,
  }),

  chargingZone: Property.Number({
    displayName: 'Charging Zone',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<LocationChargingZoneReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/locations/v2.0/{location}/charging-zones/{chargingZone}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as LocationChargingZoneReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
