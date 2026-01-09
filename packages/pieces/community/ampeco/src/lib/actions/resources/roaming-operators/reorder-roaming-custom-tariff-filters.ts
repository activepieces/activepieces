import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { ReorderRoamingCustomTariffFiltersResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PUT /public-api/resources/roaming-operators/v2.0/{roamingOperator}/custom-tariff-filters/reorder

export const reorderRoamingCustomTariffFiltersAction = createAction({
  auth: ampecoAuth,
  name: 'reorderRoamingCustomTariffFilters',
  displayName: 'Resources - Roaming Operators - Reorder Roaming Custom Tariff Filters',
  description: 'Change the ordering of custom tariff filters for a roaming operator. This operation allows partial reordering - you only need to specify the filters that need to move. Filters not included in the request will maintain their relative positions.',
  props: {
        
  roamingOperator: Property.Number({
    displayName: 'Roaming Operator',
    description: '',
    required: true,
  }),

  filters: Property.Array({
    displayName: 'Filters',
    description: 'Array of custom tariff filter IDs with their new positions. Only include filters that need to be moved - others will maintain their relative positions.',
    required: true,
    properties: { 
         
  id: Property.Number({
    displayName: 'Id',
    description: 'The ID of the custom tariff filter.',
    required: true,
  }),

  order: Property.Number({
    displayName: 'Order',
    description: 'The new position for this filter (starting from 1).',
    required: true,
  }), 
    },
  }),
  },
  async run(context): Promise<ReorderRoamingCustomTariffFiltersResponse> {
    try {
      const url = processPathParameters('/public-api/resources/roaming-operators/v2.0/{roamingOperator}/custom-tariff-filters/reorder', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['filters']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PUT,
        body,
        queryParams
      ) as ReorderRoamingCustomTariffFiltersResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
