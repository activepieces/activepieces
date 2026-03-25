import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { RoamingTariffUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PATCH /public-api/resources/roaming-tariffs/v2.0/{roamingTariff}

export const roamingTariffUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'roamingTariffUpdate',
  displayName: 'Resources - Roaming Tariffs - Update',
  description: 'Update Roaming Tariff.',
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
