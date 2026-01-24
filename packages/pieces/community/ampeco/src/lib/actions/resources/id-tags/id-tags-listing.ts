import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { IdTagsListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/id-tags/v2.0

export const idTagsListingAction = createAction({
  auth: ampecoAuth,
  name: 'idTagsListing',
  displayName: 'Resources - Id Tags - Listing',
  description: 'Get all id tags.',
  props: {
        
  filter__idTagUid: Property.Number({
    displayName: 'Filter - Id Tag Uid',
    description: 'Only list Id tags with a certain UID',
    required: false,
  }),

  filter__idLabel: Property.ShortText({
    displayName: 'Filter - Id Label',
    description: 'Only list Id tags with a certain label',
    required: false,
  }),

  filter__userId: Property.Number({
    displayName: 'Filter - User Id',
    description: 'Only list Id tags with a certain user id',
    required: false,
  }),

  filter__expireAt: Property.DateTime({
    displayName: 'Filter - Expire At',
    description: 'Only list Id tags that have an expiration date grater or equal to the supplied date',
    required: false,
  }),

  filter__status: Property.StaticDropdown({
    displayName: 'Filter - Status',
    description: 'Only list Id tags in this status',
    required: false,
    options: {
      options: [
      { label: 'enabled', value: 'enabled' },
      { label: 'disabled', value: 'disabled' },
      { label: 'suspended', value: 'suspended' }
      ],
    },
  }),

  filter__type: Property.StaticDropdown({
    displayName: 'Filter - Type',
    description: 'Only list Id tags in this type',
    required: false,
    options: {
      options: [
      { label: 'rfid', value: 'rfid' },
      { label: 'mac_address', value: 'mac_address' },
      { label: 'emaid', value: 'emaid' }
      ],
    },
  }),

  filter__partnerId: Property.Number({
    displayName: 'Filter - Partner Id',
    description: 'Only list ID tags assigned to the specified Partner ID. Pass null to list ID tags without a Partner assigned.',
    required: false,
  }),

  filter__lastUpdatedAfter: Property.DateTime({
    displayName: 'Filter - Last Updated After',
    description: 'ISO 8601 formatted date. Lists only the id tags that were last updated on and after this datetime',
    required: false,
  }),

  filter__lastUpdatedBefore: Property.DateTime({
    displayName: 'Filter - Last Updated Before',
    description: 'ISO 8601 formatted date. Lists only the id tags that were last updated on and before this datetime',
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
  async run(context): Promise<IdTagsListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/id-tags/v2.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['page', 'per_page', 'cursor', 'filter']);
      
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
      }) as IdTagsListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as IdTagsListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
