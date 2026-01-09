import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/flexibility-assets/v1.0/{flexibilityAsset}

export const deleteFlexibilityAssetAction = createAction({
  auth: ampecoAuth,
  name: 'deleteFlexibilityAsset',
  displayName: 'Resources - Flexibility Assets - Delete',
  description: 'Delete a flexibility asset.',
  props: {
        
  flexibilityAsset: Property.Number({
    displayName: 'Flexibility Asset',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/flexibility-assets/v1.0/{flexibilityAsset}', context.propsValue);
      
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
