import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ElectricityRatesListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/electricity-rates/v2.0

export const electricityRatesListingAction = createAction({
  auth: ampecoAuth,
  name: 'electricityRatesListing',
  displayName: 'Resources - Electricity Rates - Electricity Rates Listing',
  description: 'Get all Electricity rates.',
  props: {
        
  filter__utilityId: Property.Number({
    displayName: 'Filter - Utility Id',
    description: '',
    required: false,
  }),

  filter__type: Property.StaticDropdown({
    displayName: 'Filter - Type',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'admin_defined', value: 'admin_defined' },
      { label: 'octopus_go', value: 'octopus_go' },
      { label: 'agile_octopus', value: 'agile_octopus' },
      { label: 'elspot', value: 'elspot' },
      { label: 'nord_pool', value: 'nord_pool' }
      ],
    },
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
  async run(context): Promise<ElectricityRatesListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/electricity-rates/v2.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['per_page', 'cursor', 'filter']);
      
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
      }) as ElectricityRatesListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ElectricityRatesListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
