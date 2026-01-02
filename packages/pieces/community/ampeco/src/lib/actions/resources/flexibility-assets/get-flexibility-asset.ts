import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { GetFlexibilityAssetResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const getFlexibilityAssetAction = createAction({
  auth: ampecoAuth,
  name: 'getFlexibilityAsset',
  displayName: 'Resources - Flexibility Assets - Get Flexibility Asset',
  description: 'Get a flexibility asset. (Endpoint: GET /public-api/resources/flexibility-assets/v1.0/{flexibilityAsset})',
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
