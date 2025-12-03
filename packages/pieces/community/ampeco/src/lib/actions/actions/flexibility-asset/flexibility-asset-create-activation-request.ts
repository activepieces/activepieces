import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { FlexibilityAssetCreateActivationRequestResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const flexibilityAssetCreateActivationRequestAction = createAction({
  auth: ampecoAuth,
  name: 'flexibilityAssetCreateActivationRequest',
  displayName: 'Actions - Flexibility Asset - Flexibility Asset Create Activation Request',
  description: 'Create Flexibility Activation Request for a specific Asset. (Endpoint: POST /public-api/actions/flexibility-asset/v1.0/{flexibilityAsset}/create-activation-request)',
  props: {
        
  flexibilityAsset: Property.ShortText({
    displayName: 'Flexibility Asset',
    description: '',
    required: true,
  }),

  periods: Property.Array({
    displayName: 'Periods',
    description: '',
    required: false,
  }),
  },
  async run(context): Promise<FlexibilityAssetCreateActivationRequestResponse> {
    try {
      const url = processPathParameters('/public-api/actions/flexibility-asset/v1.0/{flexibilityAsset}/create-activation-request', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['periods']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as FlexibilityAssetCreateActivationRequestResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
