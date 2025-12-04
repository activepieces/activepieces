import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const roamingProviderDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'roamingProviderDelete',
  displayName: 'Resources - Roaming Providers - Roaming Provider Delete',
  description: 'Delete a Roaming Provider. (Endpoint: DELETE /public-api/resources/roaming-providers/v2.0/{roamingProvider})',
  props: {
        
  roamingProvider: Property.Number({
    displayName: 'Roaming Provider',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/roaming-providers/v2.0/{roamingProvider}', context.propsValue);
      
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
