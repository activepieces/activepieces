import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { SubscriptionsListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/subscriptions/v1.0
export const subscriptionsListingAction = createAction({
  auth: ampecoAuth,
  name: 'subscriptionsListing',
  displayName: 'Resources - Subscriptions - Subscriptions Listing',
  description: 'Get all subscriptions.',
  props: {
        
  filter__planId: Property.ShortText({
    displayName: 'Filter - Plan Id',
    description: '',
    required: false,
  }),

  filter__endDateFrom: Property.DateTime({
    displayName: 'Filter - End Date From',
    description: 'ISO 8601 formatted date',
    required: false,
  }),

  filter__endDateTo: Property.DateTime({
    displayName: 'Filter - End Date To',
    description: 'ISO 8601 formatted date',
    required: false,
  }),

  filter__status: Property.StaticDropdown({
    displayName: 'Filter - Status',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'active', value: 'active' },
      { label: 'canceled', value: 'canceled' },
      { label: 'expired', value: 'expired' },
      { label: 'suspended', value: 'suspended' },
      { label: 'pending', value: 'pending' }
      ],
    },
  }),

  filter__billedExternally: Property.ShortText({
    displayName: 'Filter - Billed Externally',
    description: 'Applicable only when the system uses both payment processor and external billing mode simultaneously. Show or hide subscriptions where users have enabled "External billing" (if allowed by the Billing settings).',
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
  async run(context): Promise<SubscriptionsListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/subscriptions/v1.0', context.propsValue);
      
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
      }) as SubscriptionsListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as SubscriptionsListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
