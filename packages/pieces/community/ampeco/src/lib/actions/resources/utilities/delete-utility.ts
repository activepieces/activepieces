import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const deleteUtilityAction = createAction({
  auth: ampecoAuth,
  name: 'deleteUtility',
  displayName: 'Resources - Utilities - Delete Utility',
  description: 'Delete a single Utility. (Endpoint: DELETE /public-api/resources/utilities/v1.0/{utility})',
  props: {
        
  utility: Property.Number({
    displayName: 'Utility',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/utilities/v1.0/{utility}', context.propsValue);
      
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
