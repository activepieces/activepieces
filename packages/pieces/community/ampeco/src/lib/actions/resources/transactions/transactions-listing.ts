import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { TransactionsListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/transactions/v1.0

export const transactionsListingAction = createAction({
  auth: ampecoAuth,
  name: 'transactionsListing',
  displayName: 'Resources - Transactions - Listing',
  description: 'Get all transactions.',
  props: {
        
  filter__createdAfter: Property.DateTime({
    displayName: 'Filter - Created After',
    description: 'ISO 8601 formatted date. Lists only the transactions created after this datetime',
    required: false,
  }),

  filter__createdBefore: Property.DateTime({
    displayName: 'Filter - Created Before',
    description: 'ISO 8601 formatted date. Lists only the transactions created before this datetime',
    required: false,
  }),

  filter__lastUpdatedAfter: Property.DateTime({
    displayName: 'Filter - Last Updated After',
    description: 'ISO 8601 formatted date. Lists only the transactions that were last updated after this datetime',
    required: false,
  }),

  filter__lastUpdatedBefore: Property.DateTime({
    displayName: 'Filter - Last Updated Before',
    description: 'ISO 8601 formatted date. Lists only the transactions that were last updated before this datetime',
    required: false,
  }),

  filter__paymentMethod: Property.StaticDropdown({
    displayName: 'Filter - Payment Method',
    description: 'Only list transactions by type of payment method',
    required: false,
    options: {
      options: [
      { label: 'visa', value: 'visa' },
      { label: 'mastercard', value: 'mastercard' },
      { label: 'paypal', value: 'paypal' },
      { label: 'maestro', value: 'maestro' },
      { label: 'amex', value: 'amex' },
      { label: 'unknown', value: 'unknown' },
      { label: 'applepay', value: 'applepay' },
      { label: 'googlepay', value: 'googlepay' },
      { label: 'twint', value: 'twint' },
      { label: 'other', value: 'other' }
      ],
    },
  }),

  filter__userId: Property.Number({
    displayName: 'Filter - User Id',
    description: 'Only list transactions by a certain user',
    required: false,
  }),

  filter__invoiceNumber: Property.Number({
    displayName: 'Filter - Invoice Number',
    description: 'Only list transaction by invoice number',
    required: false,
  }),

  filter__status: Property.StaticDropdown({
    displayName: 'Filter - Status',
    description: 'Only list transaction in this status',
    required: false,
    options: {
      options: [
      { label: 'pending', value: 'pending' },
      { label: 'finalized', value: 'finalized' },
      { label: 'failed', value: 'failed' },
      { label: 'reserved', value: 'reserved' },
      { label: 'refunded', value: 'refunded' },
      { label: 'authorized', value: 'authorized' },
      { label: 'initialized', value: 'initialized' }
      ],
    },
  }),

  filter__sessionId: Property.Number({
    displayName: 'Filter - Session Id',
    description: 'Only list transaction with this session id',
    required: false,
  }),

  filter__ref: Property.ShortText({
    displayName: 'Filter - Ref',
    description: 'Only list transactions with specific ref number.',
    required: false,
  }),

  filter__billingType: Property.StaticDropdown({
    displayName: 'Filter - Billing Type',
    description: 'Only list transactions with the selected billing type.',
    required: false,
    options: {
      options: [
      { label: 'internal', value: 'internal' },
      { label: 'external', value: 'external' }
      ],
    },
  }),

  filter__terminalId: Property.Number({
    displayName: 'Filter - Terminal Id',
    description: 'Only list transactions with specific payment terminal id.',
    required: false,
  }),

  filter__finalizedBefore: Property.DateTime({
    displayName: 'Filter - Finalized Before',
    description: 'ISO 8601 formatted date. Lists only the transactions finalized before this datetime',
    required: false,
  }),

  filter__finalizedAfter: Property.DateTime({
    displayName: 'Filter - Finalized After',
    description: 'ISO 8601 formatted date. Lists only the transactions finalized after this datetime',
    required: false,
  }),

  filter__voucherId: Property.Number({
    displayName: 'Filter - Voucher Id',
    description: 'Only list transactions paid with this specific voucher id.',
    required: false,
  }),

  filter__purchaseType: Property.StaticMultiSelectDropdown({
    displayName: 'Filter - Purchase Type',
    description: 'Only list transactions with the specified purchase type(s). Determines what the transaction was for based on its associated entity.',
    required: false,
    options: {
      options: [
      { label: 'session', value: 'session' },
      { label: 'subscription_plan', value: 'subscription_plan' },
      { label: 'topup_package', value: 'topup_package' },
      { label: 'custom_fee', value: 'custom_fee' },
      { label: 'payment_terminal_authorisation', value: 'payment_terminal_authorisation' },
      { label: 'payment_authorisation', value: 'payment_authorisation' }
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
  async run(context): Promise<TransactionsListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/transactions/v1.0', context.propsValue);
      
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
      }) as TransactionsListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as TransactionsListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
