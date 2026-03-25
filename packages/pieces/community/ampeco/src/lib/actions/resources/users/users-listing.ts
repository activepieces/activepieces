import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { UsersListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/users/v1.0

export const usersListingAction = createAction({
  auth: ampecoAuth,
  name: 'usersListing',
  displayName: 'Resources - Users - Users Listing',
  description: 'Get all users.',
  props: {
        
  filter__userGroupId: Property.Number({
    displayName: 'Filter - User Group Id',
    description: 'Only list users that belong to a certain user group',
    required: false,
  }),

  filter__partnerId: Property.Number({
    displayName: 'Filter - Partner Id',
    description: 'Only list users attached to the partner.',
    required: false,
  }),

  filter__externalId: Property.ShortText({
    displayName: 'Filter - External Id',
    description: 'Only list users with specific external id',
    required: false,
  }),

  filter__email: Property.ShortText({
    displayName: 'Filter - Email',
    description: 'Only list user with specific email',
    required: false,
  }),

  filter__externalAppData: Property.ShortText({
    displayName: 'Filter - External App Data',
    description: 'Only list records with specific external application data. You can use a dot notation to search for nested properties. For example, `filter[externalAppData.property1.property2]=value`.',
    required: false,
  }),

  filter__lastUpdatedAfter: Property.DateTime({
    displayName: 'Filter - Last Updated After',
    description: 'ISO 8601 formatted date. Lists only the users that were last updated on and after this datetime',
    required: false,
  }),

  filter__lastUpdatedBefore: Property.DateTime({
    displayName: 'Filter - Last Updated Before',
    description: 'ISO 8601 formatted date. Lists only the users that were last updated on and before this datetime',
    required: false,
  }),

  include: Property.StaticMultiSelectDropdown({
    displayName: 'Include',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'partnerInvites', value: 'partnerInvites' },
      { label: 'externalAppData', value: 'externalAppData' }
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
  async run(context): Promise<UsersListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/users/v1.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['filter', 'page', 'per_page', 'cursor', 'include']);
      
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
      }) as UsersListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as UsersListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
