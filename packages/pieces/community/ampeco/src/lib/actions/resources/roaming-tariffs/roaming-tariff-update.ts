import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { RoamingTariffUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const roamingTariffUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'roamingTariffUpdate',
  displayName: 'Resources - Roaming Tariffs - Roaming Tariff Update',
  description: 'Update Roaming Tariff. (Endpoint: PATCH /public-api/resources/roaming-tariffs/v2.0/{roamingTariff})',
  props: {
        
  roamingTariff: Property.Number({
    displayName: 'Roaming Tariff',
    description: '',
    required: true,
  }),

  tariffGroupId: Property.Number({
    displayName: 'Tariff Group Id',
    description: 'The ID of the local Tariff Group assigned to the EVSEs with this roaming tariff(s).',
    required: false,
  }),
  },
  async run(context): Promise<RoamingTariffUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/roaming-tariffs/v2.0/{roamingTariff}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['tariffGroupId']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as RoamingTariffUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
