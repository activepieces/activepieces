import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { RoamingOperatorsListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/roaming-operators/v2.0

export const roamingOperatorsListingAction = createAction({
  auth: ampecoAuth,
  name: 'roamingOperatorsListing',
  displayName: 'Resources - Roaming Operators - Roaming Operators Listing',
  description: 'Get all Roaming Operators.',
  audience: 'both',
  aiMetadata: { description: 'List all roaming operators in AMPECO. Read-only and idempotent; enable Paginate Results to fetch every page, or leave it off for a single page (up to per_page, max 100). Use to discover a roaming operator ID before reading, updating, or managing its custom tariff filters.', idempotent: true },
  props: {
        
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
  async run(context): Promise<RoamingOperatorsListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/roaming-operators/v2.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['page', 'per_page']);
      
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
      }) as RoamingOperatorsListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as RoamingOperatorsListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
