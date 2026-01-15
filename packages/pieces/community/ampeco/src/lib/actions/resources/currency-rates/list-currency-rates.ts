import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ListCurrencyRatesResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/currency-rates/v1.0

export const listCurrencyRatesAction = createAction({
  auth: ampecoAuth,
  name: 'listCurrencyRates',
  displayName: 'Resources - Currency Rates - List',
  description: 'Get all Currency Rates.',
  props: {
        
  filter__base: Property.ShortText({
    displayName: 'Filter - Base',
    description: 'Filter by base currency code',
    required: false,
  }),

  filter__target: Property.ShortText({
    displayName: 'Filter - Target',
    description: 'Filter by target currency code',
    required: false,
  }),

  filter__updatedBefore: Property.DateTime({
    displayName: 'Filter - Updated Before',
    description: 'Filter by records updated before a specific datetime',
    required: false,
  }),

  filter__updatedAfter: Property.DateTime({
    displayName: 'Filter - Updated After',
    description: 'Filter by records updated after a specific datetime',
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
  async run(context): Promise<ListCurrencyRatesResponse> {
    try {
      const url = processPathParameters('/public-api/resources/currency-rates/v1.0', context.propsValue);
      
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
      }) as ListCurrencyRatesResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ListCurrencyRatesResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
