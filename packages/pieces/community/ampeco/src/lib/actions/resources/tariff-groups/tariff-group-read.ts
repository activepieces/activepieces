import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { TariffGroupReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const tariffGroupReadAction = createAction({
  auth: ampecoAuth,
  name: 'tariffGroupRead',
  displayName: 'Resources - Tariff Groups - Tariff Group Read',
  description: 'Get a tariff group. (Endpoint: GET /public-api/resources/tariff-groups/v1.0/{tariffGroup})',
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
