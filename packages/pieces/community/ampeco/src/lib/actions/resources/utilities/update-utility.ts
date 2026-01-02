import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { UpdateUtilityResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const updateUtilityAction = createAction({
  auth: ampecoAuth,
  name: 'updateUtility',
  displayName: 'Resources - Utilities - Update Utility',
  description: 'Update a single Utility. (Endpoint: PUT /public-api/resources/utilities/v1.0/{utility})',
  props: {
        
  utility: Property.Number({
    displayName: 'Utility',
    description: '',
    required: true,
  }),

  name: Property.ShortText({
    displayName: 'Name',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<UpdateUtilityResponse> {
    try {
      const url = processPathParameters('/public-api/resources/utilities/v1.0/{utility}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['name']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PUT,
        body,
        queryParams
      ) as UpdateUtilityResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
