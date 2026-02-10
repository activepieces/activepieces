import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/roaming-operators/v2.0/{roamingOperator}/custom-tariff-filters/{customTariffFilter}

export const deleteRoamingCustomTariffFilterAction = createAction({
  auth: ampecoAuth,
  name: 'deleteRoamingCustomTariffFilter',
  displayName: 'Resources - Roaming Operators - Delete Roaming Custom Tariff Filter',
  description: 'Delete a custom tariff filter.',
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
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/roaming-operators/v2.0/{roamingOperator}/custom-tariff-filters/{customTariffFilter}', context.propsValue);
      
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
