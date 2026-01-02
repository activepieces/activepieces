import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { TopUpPackagesListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/top-up-packages/v2.0
export const topUpPackagesListingAction = createAction({
  auth: ampecoAuth,
  name: 'topUpPackagesListing',
  displayName: 'Resources - Top Up Packages - Listing',
  description: 'Get all Top-Up Packages.',
  props: {
        
  filter__enabled: Property.ShortText({
    displayName: 'Filter - Enabled',
    description: 'Only list enabled or disabled Top-Up Packages',
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
  async run(context): Promise<TopUpPackagesListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/top-up-packages/v2.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['filter', 'page', 'per_page']);
      
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
      }) as TopUpPackagesListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as TopUpPackagesListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
