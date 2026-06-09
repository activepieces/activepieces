import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { RoamingProvidersListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/roaming-providers/v2.0

export const roamingProvidersListingAction = createAction({
  auth: ampecoAuth,
  name: 'roamingProvidersListing',
  displayName: 'Resources - Roaming Providers - Listing',
  description: 'Get all Roaming Providers.',
  props: {
        
  filter__platformId: Property.Number({
    displayName: 'Filter - Platform Id',
    description: '',
    required: false,
  }),

  filter__countryCode: Property.ShortText({
    displayName: 'Filter - Country Code',
    description: '',
    required: false,
  }),

  filter__partyId: Property.ShortText({
    displayName: 'Filter - Party Id',
    description: '',
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
  async run(context): Promise<RoamingProvidersListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/roaming-providers/v2.0', context.propsValue);
      
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
      }) as RoamingProvidersListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as RoamingProvidersListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
