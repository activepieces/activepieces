import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { GetRoamingCustomTariffFilterResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const getRoamingCustomTariffFilterAction = createAction({
  auth: ampecoAuth,
  name: 'getRoamingCustomTariffFilter',
  displayName: 'Resources - Roaming Operators - Get Roaming Custom Tariff Filter',
  description: 'Get a specific custom tariff filter. (Endpoint: GET /public-api/resources/roaming-operators/v2.0/{roamingOperator}/custom-tariff-filters/{customTariffFilter})',
  props: {
        
  roamingOperator: Property.Number({
    displayName: 'Roaming Operator',
    description: '',
    required: true,
  }),

  customTariffFilter: Property.Number({
    displayName: 'Custom Tariff Filter',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<GetRoamingCustomTariffFilterResponse> {
    try {
      const url = processPathParameters('/public-api/resources/roaming-operators/v2.0/{roamingOperator}/custom-tariff-filters/{customTariffFilter}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as GetRoamingCustomTariffFilterResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
