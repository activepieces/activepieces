import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/parking-spaces/v1.0/{parkingSpace}/update-occupancy-status

export const parkingSpaceUpdateOccupancyStatusAction = createAction({
  auth: ampecoAuth,
  name: 'parkingSpaceUpdateOccupancyStatus',
  displayName: 'Actions - Parking Spaces - Update Occupancy Status',
  description: 'Parking Space / Update occupancy status.',
  props: {
        
  parkingSpace: Property.Number({
    displayName: 'Parking Space',
    required: true,
  }),

  status: Property.StaticDropdown({
    displayName: 'Status',
    required: true,
    options: {
      options: [
      { label: 'available', value: 'available' },
      { label: 'occupied', value: 'occupied' }
      ],
    },
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/parking-spaces/v1.0/{parkingSpace}/update-occupancy-status', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['status']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
