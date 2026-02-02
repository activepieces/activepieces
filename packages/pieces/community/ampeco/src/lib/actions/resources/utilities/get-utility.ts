import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { GetUtilityResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/utilities/v1.0/{utility}
export const getUtilityAction = createAction({
  auth: ampecoAuth,
  name: 'getUtility',
  displayName: 'Resources - Utilities - Get Utility',
  description: 'Get a single Utility.',
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
