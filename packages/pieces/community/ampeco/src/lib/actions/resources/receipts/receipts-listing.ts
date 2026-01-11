import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ReceiptsListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/receipts/v2.0

export const receiptsListingAction = createAction({
  auth: ampecoAuth,
  name: 'receiptsListing',
  displayName: 'Resources - Receipts - Receipts Listing',
  description: 'Get all receipts.',
  props: {
        
  filter__userId: Property.Number({
    displayName: 'Filter - User Id',
    description: 'Only list Receipts with a certain user id',
    required: false,
  }),

  filter__taxId: Property.Number({
    displayName: 'Filter - Tax Id',
    description: 'Only list Receipts with specific VAT id',
    required: false,
  }),

  filter__paymentStatus: Property.StaticDropdown({
    displayName: 'Filter - Payment Status',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'pending', value: 'pending' },
      { label: 'paid', value: 'paid' },
      { label: 'partially_paid', value: 'partially_paid' }
      ],
    },
  }),

  filter__periodStart: Property.DateTime({
    displayName: 'Filter - Period Start',
    description: 'ISO 8601 formatted date',
    required: false,
  }),

  filter__periodEnd: Property.DateTime({
    displayName: 'Filter - Period End',
    description: 'ISO 8601 formatted date',
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
  async run(context): Promise<ReceiptsListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/receipts/v2.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['page', 'per_page', 'filter']);
      
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
      }) as ReceiptsListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ReceiptsListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
