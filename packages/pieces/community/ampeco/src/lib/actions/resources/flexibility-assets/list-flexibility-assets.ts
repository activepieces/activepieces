import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ListFlexibilityAssetsResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/flexibility-assets/v1.0

export const listFlexibilityAssetsAction = createAction({
  auth: ampecoAuth,
  name: 'listFlexibilityAssets',
  displayName: 'Resources - Flexibility Assets - List',
  description: 'Get a list of Flexibility Assets.',
  props: {
        
  filter__updatedSince: Property.DateTime({
    displayName: 'Filter - Updated Since',
    description: 'Filter for the assets updated since the given timestamp',
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
  async run(context): Promise<ListFlexibilityAssetsResponse> {
    try {
      const url = processPathParameters('/public-api/resources/flexibility-assets/v1.0', context.propsValue);
      
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
      }) as ListFlexibilityAssetsResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ListFlexibilityAssetsResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
