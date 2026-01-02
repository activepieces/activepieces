import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { CircuitsListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/circuits/v2.0

export const circuitsListingAction = createAction({
  auth: ampecoAuth,
  name: 'circuitsListing',
  displayName: 'Resources - Circuits - Circuits Listing',
  description: 'Get all circuits.',
  props: {
        
  include: Property.StaticMultiSelectDropdown({
    displayName: 'Include',
    required: false,
    options: {
      options: [
      { label: 'chargePointPriorities', value: 'chargePointPriorities' },
      { label: 'userPriorities', value: 'userPriorities' },
      { label: 'socPriorities', value: 'socPriorities' },
      { label: 'consumption', value: 'consumption' },
      { label: 'unmanagedLoad', value: 'unmanagedLoad' }
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
  async run(context): Promise<CircuitsListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/circuits/v2.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['include', 'per_page', 'cursor']);
      
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
      }) as CircuitsListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as CircuitsListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
