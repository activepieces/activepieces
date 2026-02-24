import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ListPcIdsResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/provisioning-certificates/v2.0

export const listPcIdsAction = createAction({
  auth: ampecoAuth,
  name: 'listPcIds',
  displayName: 'Resources - Provisioning Certificates - List Pc Ids',
  description: 'Get all Provisioning Certificates.',
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
  async run(context): Promise<ListPcIdsResponse> {
    try {
      const url = processPathParameters('/public-api/resources/provisioning-certificates/v2.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['per_page', 'cursor']);
      
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
      }) as ListPcIdsResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ListPcIdsResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
