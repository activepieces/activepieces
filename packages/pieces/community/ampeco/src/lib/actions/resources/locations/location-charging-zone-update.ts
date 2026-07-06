import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { LocationChargingZoneUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PATCH /public-api/resources/locations/v2.0/{location}/charging-zones/{chargingZone}
export const locationChargingZoneUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'locationChargingZoneUpdate',
  displayName: 'Resources - Locations - Update Charging Zone',
  description: 'Update a existing Charging Zone.',
  audience: 'both',
  aiMetadata: { description: 'Updates editable fields (name, status, localized additional info) of an existing charging zone, identified by its location ID and charging zone ID. Use to modify a known zone; to add a new one use the Create Charging Zone action. Only the fields you supply are changed, so repeating the same call converges to the same state and is idempotent.', idempotent: true },
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
