import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ListRoamingCustomTariffFiltersResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/roaming-operators/v2.0/{roamingOperator}/custom-tariff-filters

export const listRoamingCustomTariffFiltersAction = createAction({
  auth: ampecoAuth,
  name: 'listRoamingCustomTariffFilters',
  displayName: 'Resources - Roaming Operators - List Roaming Custom Tariff Filters',
  description: 'Get all custom tariff filters for a roaming operator.',
  props: {
        
  roamingOperator: Property.Number({
    displayName: 'Roaming Operator',
    description: '',
    required: true,
  }),

  filter__status: Property.StaticDropdown({
    displayName: 'Filter - Status',
    description: 'Filter by status (enabled or disabled)',
    required: false,
    options: {
      options: [
      { label: 'enabled', value: 'enabled' },
      { label: 'disabled', value: 'disabled' }
      ],
    },
  }),

  filter__createdAfter: Property.DateTime({
    displayName: 'Filter - Created After',
    description: 'Filter by creation date (greater than or equal to)',
    required: false,
  }),

  filter__createdBefore: Property.DateTime({
    displayName: 'Filter - Created Before',
    description: 'Filter by creation date (less than or equal to)',
    required: false,
  }),
    per_page: Property.Number({
      displayName: 'Per page',
      description: 'When pagination is enabled: maximum total results across all pages. When pagination is disabled: number of results per API request (max 100).',
      required: false,
      defaultValue: 100,
    }),
    usePagination: Property.Checkbox({
      displayName: 'Paginate Results',
      description: 'Whether to automatically paginate to fetch all results',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context): Promise<ListRoamingCustomTariffFiltersResponse> {
    try {
      const url = processPathParameters('/public-api/resources/roaming-operators/v2.0/{roamingOperator}/custom-tariff-filters', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['filter', 'per_page', 'cursor']);
      
      const body = undefined;

          if (context.propsValue.usePagination) {
      return await paginate({
        auth: context.auth,
        method: 'GET',
        path: url,
        queryParams,
        body,
        perPage: context.propsValue.per_page ?? 100,
        dataPath: 'data',
      }) as ListRoamingCustomTariffFiltersResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ListRoamingCustomTariffFiltersResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
