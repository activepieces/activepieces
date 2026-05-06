import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { UpdateParkingSpaceResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PUT /public-api/resources/parking-spaces/v1.0/{parkingSpace}

export const updateParkingSpaceAction = createAction({
  auth: ampecoAuth,
  name: 'updateParkingSpace',
  displayName: 'Resources - Parking Spaces - Update',
  description: 'Update Parking Space.',
  props: {
        
  parkingSpace: Property.Number({
    displayName: 'Parking Space',
    description: '',
    required: true,
  }),

  label: Property.ShortText({
    displayName: 'Label',
    description: '',
    required: true,
  }),

  locationId: Property.Number({
    displayName: 'Location Id',
    description: '',
    required: true,
  }),

  externalId: Property.ShortText({
    displayName: 'External Id',
    description: '',
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

  occupancyStatus: Property.StaticDropdown({
    displayName: 'Occupancy Status',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'unknown', value: 'unknown' },
      { label: 'available', value: 'available' },
      { label: 'occupied', value: 'occupied' }
      ],
    },
  }),

  disabilitiesAccessible: Property.StaticDropdown({
    displayName: 'Disabilities Accessible',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  evses: Property.Array({
    displayName: 'Evses',
    description: 'The list of Evses at the same Parking Space. The Evses should belongs to same charging zone.',
    required: false,
  }),
  },
  async run(context): Promise<UpdateParkingSpaceResponse> {
    try {
      const url = processPathParameters('/public-api/resources/parking-spaces/v1.0/{parkingSpace}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['label', 'locationId', 'externalId', 'status', 'occupancyStatus', 'disabilitiesAccessible', 'evses']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PUT,
        body,
        queryParams
      ) as UpdateParkingSpaceResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
