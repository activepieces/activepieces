import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { GetParkingSpaceResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/parking-spaces/v1.0/{parkingSpace}

export const getParkingSpaceAction = createAction({
  auth: ampecoAuth,
  name: 'getParkingSpace',
  displayName: 'Resources - Parking Spaces - Get',
  description: 'Get Parking Space.',
  props: {
        
  parkingSpace: Property.Number({
    displayName: 'Parking Space',
    description: '',
    required: true,
  }),

  include: Property.StaticMultiSelectDropdown({
    displayName: 'Include',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'evses', value: 'evses' }
      ],
    },
  }),
  },
  async run(context): Promise<GetParkingSpaceResponse> {
    try {
      const url = processPathParameters('/public-api/resources/parking-spaces/v1.0/{parkingSpace}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['include']);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as GetParkingSpaceResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
