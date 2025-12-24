import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { CreateUtilityResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const createUtilityAction = createAction({
  auth: ampecoAuth,
  name: 'createUtility',
  displayName: 'Resources - Utilities - Create Utility',
  description: 'Create Utility. (Endpoint: POST /public-api/resources/utilities/v1.0)',
  props: {
        
  name: Property.ShortText({
    displayName: 'Name',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<CreateUtilityResponse> {
    try {
      const url = processPathParameters('/public-api/resources/utilities/v1.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['name']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as CreateUtilityResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
