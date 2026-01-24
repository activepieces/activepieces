import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { GetFlexibilityAssetResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/flexibility-assets/v1.0/{flexibilityAsset}

export const getFlexibilityAssetAction = createAction({
  auth: ampecoAuth,
  name: 'getFlexibilityAsset',
  displayName: 'Resources - Flexibility Assets - Get',
  description: 'Get a flexibility asset.',
  props: {
        
  flexibilityAsset: Property.Number({
    displayName: 'Flexibility Asset',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<GetFlexibilityAssetResponse> {
    try {
      const url = processPathParameters('/public-api/resources/flexibility-assets/v1.0/{flexibilityAsset}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as GetFlexibilityAssetResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
