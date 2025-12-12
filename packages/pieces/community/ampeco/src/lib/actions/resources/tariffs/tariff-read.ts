import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { TariffReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const tariffReadAction = createAction({
  auth: ampecoAuth,
  name: 'tariffRead',
  displayName: 'Resources - Tariffs - Tariff Read',
  description: 'Get a tariff. (Endpoint: GET /public-api/resources/tariffs/v1.0/{tariff})',
  props: {
        
  tariff: Property.Number({
    displayName: 'Tariff',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<TariffReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/tariffs/v1.0/{tariff}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as TariffReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
