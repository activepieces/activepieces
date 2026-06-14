import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/locations/v2.0/{location}

export const locationDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'locationDelete',
  displayName: 'Resources - Locations - Delete',
  description: 'Delete a location.',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes one AMPECO charging location by its numeric ID. Use only when the location should be removed entirely; requires the location ID. Idempotent in effect: repeating the call converges to the same removed state, though a second call may report the location as already gone.', idempotent: true },
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
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/locations/v2.0/{location}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['include']);
      
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
