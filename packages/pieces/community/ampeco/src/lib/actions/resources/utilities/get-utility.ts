import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { GetUtilityResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const getUtilityAction = createAction({
  auth: ampecoAuth,
  name: 'getUtility',
  displayName: 'Resources - Utilities - Get Utility',
  description: 'Get a single Utility. (Endpoint: GET /public-api/resources/utilities/v1.0/{utility})',
  props: {
        
  utility: Property.Number({
    displayName: 'Utility',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<GetUtilityResponse> {
    try {
      const url = processPathParameters('/public-api/resources/utilities/v1.0/{utility}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as GetUtilityResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
