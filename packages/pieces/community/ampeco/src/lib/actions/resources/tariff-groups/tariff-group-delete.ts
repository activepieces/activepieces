import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

//Endpoint: DELETE /public-api/resources/tariff-groups/v1.0/{tariffGroup}
export const tariffGroupDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'tariffGroupDelete',
  displayName: 'Resources - Tariff Groups - Delete',
  description: 'Delete a tariff group.',
  props: {
        
  tariffGroup: Property.Number({
    displayName: 'Tariff Group',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/tariff-groups/v1.0/{tariffGroup}', context.propsValue);
      
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
