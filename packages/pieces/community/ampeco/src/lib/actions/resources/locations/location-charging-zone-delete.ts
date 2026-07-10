import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/locations/v2.0/{location}/charging-zones/{chargingZone}

export const locationChargingZoneDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'locationChargingZoneDelete',
  displayName: 'Resources - Locations - Delete Charging Zone',
  description: 'Location / Charging Zone / Delete.',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes one charging zone from a given AMPECO location; requires both the location ID and the charging zone ID. Use to remove a single zone. Idempotent in effect: the end state is the zone being gone, though repeating may report it as already removed.', idempotent: true },
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
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/locations/v2.0/{location}/charging-zones/{chargingZone}', context.propsValue);
      
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
