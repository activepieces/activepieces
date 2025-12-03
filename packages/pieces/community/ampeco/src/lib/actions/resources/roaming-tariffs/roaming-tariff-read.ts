import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { RoamingTariffReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const roamingTariffReadAction = createAction({
  auth: ampecoAuth,
  name: 'roamingTariffRead',
  displayName: 'Resources - Roaming Tariffs - Roaming Tariff Read',
  description: 'Get a Roaming Tariff. (Endpoint: GET /public-api/resources/roaming-tariffs/v2.0/{roamingTariff})',
  props: {
        
  roamingTariff: Property.Number({
    displayName: 'Roaming Tariff',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<RoamingTariffReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/roaming-tariffs/v2.0/{roamingTariff}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as RoamingTariffReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
