import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { AuthorizationsListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/authorizations/v2.0

export const authorizationsListingAction = createAction({
  auth: ampecoAuth,
  name: 'authorizationsListing',
  displayName: 'Resources - Authorizations - Authorizations Listing',
  description: 'Get all authorizations.',
  props: {
        
  filter__createdAfter: Property.DateTime({
    displayName: 'Filter - Created After',
    description: 'ISO 8601 formatted date. Lists only the authorizations created after this datetime',
    required: false,
  }),

  filter__createdBefore: Property.DateTime({
    displayName: 'Filter - Created Before',
    description: 'ISO 8601 formatted date. Lists only the authorizations created before this datetime',
    required: false,
  }),

  filter__lastUpdatedAfter: Property.DateTime({
    displayName: 'Filter - Last Updated After',
    description: 'ISO 8601 formatted date. Lists only the authorizations that were last updated after this datetime',
    required: false,
  }),

  filter__lastUpdatedBefore: Property.DateTime({
    displayName: 'Filter - Last Updated Before',
    description: 'ISO 8601 formatted date. Lists only the authorizations that were last updated before this datetime',
    required: false,
  }),

  filter__status: Property.ShortText({
    displayName: 'Filter - Status',
    description: 'Lists only authorizations with one of the following statuses: "accepted", "rejected", "pending"',
    required: false,
  }),

  filter__method: Property.ShortText({
    displayName: 'Filter - Method',
    description: 'Lists only authorizations with one of the following methods: "mobile_device", "rfid_tag", "admin_account", "plug_and_charge", "plug_and_charge_iso15118", "roaming", "payment_terminal"',
    required: false,
  }),

  filter__partnerId: Property.Number({
    displayName: 'Filter - Partner Id',
    description: 'Lists only authorizations of users who are associated to a particular partner',
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
  async run(context): Promise<AuthorizationsListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/authorizations/v2.0', context.propsValue);
      
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
      }) as AuthorizationsListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as AuthorizationsListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
