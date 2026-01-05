import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { LocationReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/locations/v2.0/{location}

export const locationReadAction = createAction({
  auth: ampecoAuth,
  name: 'locationRead',
  displayName: 'Resources - Locations - Read',
  description: 'Get a location.',
  props: {
        
  location: Property.Number({
    displayName: 'Location',
    description: '',
    required: true,
  }),

  include: Property.StaticMultiSelectDropdown({
    displayName: 'Include',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'chargingZones', value: 'chargingZones' },
      { label: 'locationImage', value: 'locationImage' },
      { label: 'images', value: 'images' },
      { label: 'externalAppData', value: 'externalAppData' }
      ],
    },
  }),
  },
  async run(context): Promise<LocationReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/locations/v2.0/{location}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['include']);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as LocationReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
