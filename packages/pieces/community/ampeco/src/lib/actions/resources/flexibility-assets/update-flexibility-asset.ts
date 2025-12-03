import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { UpdateFlexibilityAssetResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const updateFlexibilityAssetAction = createAction({
  auth: ampecoAuth,
  name: 'updateFlexibilityAsset',
  displayName: 'Resources - Flexibility Assets - Update Flexibility Asset',
  description: 'Update a flexibility asset. (Endpoint: PATCH /public-api/resources/flexibility-assets/v1.0/{flexibilityAsset})',
  props: {
        
  flexibilityAsset: Property.Number({
    displayName: 'Flexibility Asset',
    description: '',
    required: true,
  }),

  description: Property.ShortText({
    displayName: 'Description',
    description: 'Short description of the flexibility asset.',
    required: false,
  }),

  integrationId: Property.Number({
    displayName: 'Integration Id',
    description: 'Flexibility integration.',
    required: false,
  }),
  },
  async run(context): Promise<UpdateFlexibilityAssetResponse> {
    try {
      const url = processPathParameters('/public-api/resources/flexibility-assets/v1.0/{flexibilityAsset}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['description', 'integrationId']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as UpdateFlexibilityAssetResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
