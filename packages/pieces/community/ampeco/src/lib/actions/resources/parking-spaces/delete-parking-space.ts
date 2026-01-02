import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const deleteParkingSpaceAction = createAction({
  auth: ampecoAuth,
  name: 'deleteParkingSpace',
  displayName: 'Resources - Parking Spaces - Delete Parking Space',
  description: 'Delete Parking Space. (Endpoint: DELETE /public-api/resources/parking-spaces/v1.0/{parkingSpace})',
  props: {
        
  parkingSpace: Property.Number({
    displayName: 'Parking Space',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/parking-spaces/v1.0/{parkingSpace}', context.propsValue);
      
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
