import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { UserGroupsListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/user-groups/v1.0

export const userGroupsListingAction = createAction({
  auth: ampecoAuth,
  name: 'userGroupsListing',
  displayName: 'Resources - User Groups - Listing',
  description: 'Get all user groups.',
  props: {
        
  filter__noPartner: Property.ShortText({
    displayName: 'Filter - No Partner',
    description: 'True returns User Groups that have no Partner associated, false returns User Groups that have a Partner associated.',
    required: false,
  }),

  filter__partnerId: Property.Number({
    displayName: 'Filter - Partner Id',
    description: 'User Groups of a specific Partner.',
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
  async run(context): Promise<UserGroupsListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/user-groups/v1.0', context.propsValue);
      
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
      }) as UserGroupsListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as UserGroupsListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
