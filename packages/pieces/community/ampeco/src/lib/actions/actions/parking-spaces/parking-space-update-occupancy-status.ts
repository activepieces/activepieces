import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const parkingSpaceUpdateOccupancyStatusAction = createAction({
  auth: ampecoAuth,
  name: 'parkingSpaceUpdateOccupancyStatus',
  displayName: 'Actions - Parking Spaces - Parking Space Update Occupancy Status',
  description: 'Parking Space / Update occupancy status. (Endpoint: POST /public-api/actions/parking-spaces/v1.0/{parkingSpace}/update-occupancy-status)',
  props: {
        
  parkingSpace: Property.Number({
    displayName: 'Parking Space',
    description: '',
    required: true,
  }),

  status: Property.StaticDropdown({
    displayName: 'Status',
    description: '',
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
