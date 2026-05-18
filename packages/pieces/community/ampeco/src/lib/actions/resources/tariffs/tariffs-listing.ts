import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { TariffsListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/tariffs/v1.0

export const tariffsListingAction = createAction({
  auth: ampecoAuth,
  name: 'tariffsListing',
  displayName: 'Resources - Tariffs - Listing',
  description: 'Get all tariff. Also you could use the "tariffGroupId" and the "userId" to "resolve" the concrete tariff within a group that would be applied to the specified user.',
  props: {
        
  filter__tariffGroupId: Property.Number({
    displayName: 'Filter - Tariff Group Id',
    description: 'Only list tariffs in a certain group',
    required: false,
  }),

  filter__userId: Property.Number({
    displayName: 'Filter - User Id',
    description: 'Can only be used with `tariffGroupId`. When set, a single tariff of the group will be returned (no meta or link props will be included), that will be applied to the when the given user is charging. Note that when you set it to empty (null) then the tariff for anonymous charging will be returned',
    required: false,
  }),

  filter__type: Property.ShortText({
    displayName: 'Filter - Type',
    description: 'Only list tariff of this specific type',
    required: false,
  }),

  filter__partnerId: Property.Number({
    displayName: 'Filter - Partner Id',
    description: 'Only list tariffs managed by certain partner.',
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
  async run(context): Promise<TariffsListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/tariffs/v1.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['filter', 'page', 'per_page', 'cursor']);
      
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
      }) as TariffsListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as TariffsListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
