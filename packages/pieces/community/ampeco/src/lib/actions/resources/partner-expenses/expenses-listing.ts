import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ExpensesListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/partner-expenses/v1.1

export const expensesListingAction = createAction({
  auth: ampecoAuth,
  name: 'expensesListing',
  displayName: 'Resources - Partner Expenses - Expenses Listing',
  description: 'Get all expenses.',
  props: {
        
  filter__partnerId: Property.Number({
    displayName: 'Filter - Partner Id',
    description: 'Only list expenses associated with a certain partner',
    required: false,
  }),

  filter__settlementReportId: Property.Number({
    displayName: 'Filter - Settlement Report Id',
    description: 'Only list expenses associated with a certain settlement report',
    required: false,
  }),

  filter__dateBefore: Property.DateTime({
    displayName: 'Filter - Date Before',
    description: '',
    required: false,
  }),

  filter__dateAfter: Property.DateTime({
    displayName: 'Filter - Date After',
    description: '',
    required: false,
  }),

  filter__origin: Property.StaticDropdown({
    displayName: 'Filter - Origin',
    description: 'Only list revenue by origin',
    required: false,
    options: {
      options: [
      { label: 'platform-fee-emsp', value: 'platform-fee-emsp' },
      { label: 'platform-fee-cpo', value: 'platform-fee-cpo' },
      { label: 'user-custom-fee', value: 'user-custom-fee' },
      { label: 'session-emsp', value: 'session-emsp' }
      ],
    },
  }),

  filter__currencyCode: Property.ShortText({
    displayName: 'Filter - Currency Code',
    description: '3-letter currency code (ISO 4217). Only list expenses by currency',
    required: false,
  }),

  withBreakdown: Property.StaticDropdown({
    displayName: 'With Breakdown',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
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
  async run(context): Promise<ExpensesListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/partner-expenses/v1.1', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['filter', 'withBreakdown', 'per_page', 'cursor']);
      
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
      }) as ExpensesListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ExpensesListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
