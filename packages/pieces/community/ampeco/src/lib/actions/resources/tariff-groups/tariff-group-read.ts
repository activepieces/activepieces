import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { TariffGroupReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/tariff-groups/v1.0/{tariffGroup}
export const tariffGroupReadAction = createAction({
  auth: ampecoAuth,
  name: 'tariffGroupRead',
  displayName: 'Resources - Tariff Groups - Read',
  description: 'Get a tariff group.',
  props: {
        
  tariffGroup: Property.Number({
    displayName: 'Tariff Group',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<TariffGroupReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/tariff-groups/v1.0/{tariffGroup}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as TariffGroupReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
