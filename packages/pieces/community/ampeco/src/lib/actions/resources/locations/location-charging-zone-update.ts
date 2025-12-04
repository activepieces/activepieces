import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { LocationChargingZoneUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const locationChargingZoneUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'locationChargingZoneUpdate',
  displayName: 'Resources - Locations - Location Charging Zone Update',
  description: 'Update a existing Charging Zone. (Endpoint: PATCH /public-api/resources/locations/v2.0/{location}/charging-zones/{chargingZone})',
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

  name: Property.ShortText({
    displayName: 'Name',
    description: 'Internal name of the Charging Zone. This isn\'t visible to end-users in the app.',
    required: false,
  }),

  status: Property.StaticDropdown({
    displayName: 'Status',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'enabled', value: 'enabled' },
      { label: 'disabled', value: 'disabled' }
      ],
    },
  }),

  additionalInfo__enabled: Property.StaticDropdown({
    displayName: 'Additional Info - Enabled',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  additionalInfo__title: Property.Array({
    displayName: 'Additional Info - Title',
    description: '',
    required: false,
    properties: { 
         
  locale: Property.ShortText({
    displayName: 'Locale',
    description: 'valid locale.',
    required: false,
  }),

  translation: Property.ShortText({
    displayName: 'Translation',
    description: '',
    required: false,
  }), 
    },
  }),

  additionalInfo__description: Property.Array({
    displayName: 'Additional Info - Description',
    description: '',
    required: false,
    properties: { 
         
  locale: Property.ShortText({
    displayName: 'Locale',
    description: 'valid locale.',
    required: false,
  }),

  translation: Property.ShortText({
    displayName: 'Translation',
    description: '',
    required: false,
  }), 
    },
  }),
  },
  async run(context): Promise<LocationChargingZoneUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/locations/v2.0/{location}/charging-zones/{chargingZone}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['name', 'status', 'additionalInfo']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as LocationChargingZoneUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
