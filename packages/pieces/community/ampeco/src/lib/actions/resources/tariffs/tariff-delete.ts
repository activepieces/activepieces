import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const tariffDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'tariffDelete',
  displayName: 'Resources - Tariffs - Tariff Delete',
  description: 'Delete a tariff. (Endpoint: DELETE /public-api/resources/tariffs/v1.0/{tariff})',
  props: {
        
  tariff: Property.Number({
    displayName: 'Tariff',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/tariffs/v1.0/{tariff}', context.propsValue);
      
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
