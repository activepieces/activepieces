import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/parking-spaces/v1.0/{parkingSpace}

export const deleteParkingSpaceAction = createAction({
  auth: ampecoAuth,
  name: 'deleteParkingSpace',
  displayName: 'Resources - Parking Spaces - Delete',
  description: 'Delete Parking Space.',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete a parking space by its numeric id. Destructive and not reversible; deleting an already-removed id will error. Naturally idempotent in effect (the space ends up gone) but treat as unsafe to retry blindly.', idempotent: false },
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
