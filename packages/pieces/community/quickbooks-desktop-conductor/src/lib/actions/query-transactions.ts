import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { spreadIfDefined } from '@activepieces/pieces-framework';
import { quickbooksDesktopConductorAuth } from '../auth';
import { conductorClient, ConductorAuth } from '../common/client';
import { queryTransactionsActionOutputSchema } from '../output-schemas';

const MAX_PAGE_SIZE = 150;

type ConductorTransaction = {
  transactionType: string;
  transactionId: string;
  transactionDate: string;
  refNumber: string | null;
  amount: string;
  memo: string | null;
  entity: { id: string; fullName: string } | null;
  account: { id: string; fullName: string } | null;
  createdAt: string;
  updatedAt: string;
};

function toDateOnly(isoDateTime: string): string {
  return isoDateTime.split('T')[0];
}

function flattenTransaction(transaction: ConductorTransaction) {
  return {
    transaction_type: transaction.transactionType,
    transaction_id: transaction.transactionId,
    transaction_date: transaction.transactionDate,
    ref_number: transaction.refNumber,
    amount: transaction.amount,
    memo: transaction.memo,
    entity_id: transaction.entity?.id ?? null,
    entity_name: transaction.entity?.fullName ?? null,
    account_id: transaction.account?.id ?? null,
    account_name: transaction.account?.fullName ?? null,
    created_at: transaction.createdAt,
    updated_at: transaction.updatedAt,
  };
}

export const queryTransactionsAction = createAction({
  auth: quickbooksDesktopConductorAuth,
  name: 'query_transactions',
  classification: 'SEARCH',
  displayName: 'Query Transactions',
  description: 'Searches across all transaction types in QuickBooks Desktop (invoices, bills, payments, and more) with date and type filters.',
  audience: 'both',
  aiMetadata: {
    description:
      'Search QuickBooks Desktop transactions across all types (invoice, bill, receive_payment, bill_payment_check, bill_payment_credit_card, and more) with date-range and payment-status filters. Only common fields are returned (id, type, date, amount, entity, account) — use the type-specific action or Custom API Call for full line-item detail. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: queryTransactionsActionOutputSchema,
  props: {
    transactionDateFrom: Property.DateTime({
      displayName: 'Transaction Date From',
      required: false,
    }),
    transactionDateTo: Property.DateTime({
      displayName: 'Transaction Date To',
      required: false,
    }),
    transactionTypes: Property.StaticMultiSelectDropdown({
      displayName: 'Transaction Types',
      description: 'Leave empty to search all types.',
      required: false,
      options: {
        options: [
          { label: 'Invoice', value: 'invoice' },
          { label: 'Bill', value: 'bill' },
          { label: 'Customer Payment', value: 'receive_payment' },
          { label: 'Bill Payment (Check)', value: 'bill_payment_check' },
          { label: 'Bill Payment (Credit Card)', value: 'bill_payment_credit_card' },
          { label: 'Purchase Order', value: 'purchase_order' },
          { label: 'Credit Memo', value: 'credit_memo' },
          { label: 'Sales Receipt', value: 'sales_receipt' },
          { label: 'Estimate', value: 'estimate' },
          { label: 'Check', value: 'check' },
          { label: 'Transfer', value: 'transfer' },
        ],
      },
    }),
    paymentStatus: Property.StaticDropdown({
      displayName: 'Payment Status',
      description: 'Leave empty to search regardless of payment status.',
      required: false,
      options: {
        options: [
          { label: 'Open (unpaid)', value: 'open' },
          { label: 'Closed (paid)', value: 'closed' },
          { label: 'Either', value: 'either' },
        ],
      },
    }),
    entityId: Property.ShortText({
      displayName: 'Entity ID',
      description: 'Optional. A customer, vendor, or employee id to filter by — typically chained from another step\'s output (e.g. Upsert Customer\'s Customer ID), not typed by hand.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Max Results',
      description: `Results per page (1–${MAX_PAGE_SIZE}).`,
      required: false,
      defaultValue: MAX_PAGE_SIZE,
      display: 'stepper',
      min: 1,
      max: MAX_PAGE_SIZE,
    }),
    cursor: Property.ShortText({
      displayName: 'Page Cursor',
      description: 'Optional. Pass the Next Cursor from a previous call\'s output to fetch the next page.',
      required: false,
      advanced: true,
    }),
  },
  async run(context) {
    const { propsValue } = context;
    const auth: ConductorAuth = {
      secretKey: context.auth.props.secretKey,
      endUserId: context.auth.props.endUserId,
    };

    if (propsValue.limit && (propsValue.limit < 1 || propsValue.limit > MAX_PAGE_SIZE)) {
      throw new Error(`Max Results must be between 1 and ${MAX_PAGE_SIZE} — got ${propsValue.limit}.`);
    }

    const queryParams: Record<string, string> = {
      limit: String(propsValue.limit ?? MAX_PAGE_SIZE),
      ...spreadIfDefined('transactionDateFrom', propsValue.transactionDateFrom ? toDateOnly(propsValue.transactionDateFrom) : undefined),
      ...spreadIfDefined('transactionDateTo', propsValue.transactionDateTo ? toDateOnly(propsValue.transactionDateTo) : undefined),
      ...spreadIfDefined('paymentStatus', propsValue.paymentStatus),
      ...spreadIfDefined('entityIds', propsValue.entityId),
      ...spreadIfDefined('cursor', propsValue.cursor),
    };

    // queryParams only takes one value per key, but Conductor wants transactionTypes repeated,
    // not comma-joined — so it's pre-encoded straight into the URL instead. This works because
    // the client's getUrl preserves any query string already on the URL before merging queryParams.
    const transactionTypesQuery = (propsValue.transactionTypes ?? [])
      .map((type) => `transactionTypes=${encodeURIComponent(type)}`)
      .join('&');
    const resourceUri = transactionTypesQuery
      ? `/quickbooks-desktop/transactions?${transactionTypesQuery}`
      : '/quickbooks-desktop/transactions';

    const response = await conductorClient.request<{
      data: ConductorTransaction[];
      nextCursor: string | null;
      hasMore: boolean;
    }>({
      auth,
      method: HttpMethod.GET,
      resourceUri,
      queryParams,
    });

    return {
      transactions: response.data.map(flattenTransaction),
      count: response.data.length,
      next_cursor: response.nextCursor,
      has_more: response.hasMore,
    };
  },
});
