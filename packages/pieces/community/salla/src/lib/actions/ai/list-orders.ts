import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../../auth';
import { sallaUtils } from '../../common/helpers';
import { sallaOrders } from '../../common/orders';
import { sallaOutputSchemas } from '../../common/output-schemas';

export const aiListOrdersAction = createAction({
  auth: sallaAuth,
  name: 'ai_list_orders',
  classification: 'SEARCH',
  displayName: 'List Orders',
  description: 'Lists store orders that match the given filters.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Salla orders matching optional filters (status IDs, payment methods, date range, customer, reference number, keyword, branches), returning each order summary with its internal id. Use it to turn the reference number a customer quotes into the order id that Get Order, Update Order Status and the other order actions need; use List Order Statuses and List Payment Methods first to get valid filter values. Returns at most max_results orders (cap 200) and truncated=true when more exist.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.orderList,
  props: {
    status_ids: Property.Array({
      displayName: 'Status IDs',
      description:
        'Numeric order status IDs from List Order Statuses, for example ["566146469"]. Matches orders in any of them. Leave empty for all statuses.',
      required: false,
    }),
    payment_methods: Property.Array({
      displayName: 'Payment Methods',
      description:
        'Payment method slugs from List Payment Methods, for example ["mada", "cod"]. Matches orders paid with any of them. Leave empty for all.',
      required: false,
    }),
    from_date: Property.ShortText({
      displayName: 'From Date',
      description: 'Only orders created on or after this day, store time (Asia/Riyadh), format YYYY-MM-DD, for example 2026-11-01.',
      required: false,
    }),
    to_date: Property.ShortText({
      displayName: 'To Date',
      description: 'Only orders created on or before this day, store time (Asia/Riyadh), format YYYY-MM-DD, for example 2026-11-30.',
      required: false,
    }),
    customer_id: Property.Number({
      displayName: 'Customer ID',
      description: 'Numeric Salla customer ID, for example 1209983424. Returns only that customer\'s orders.',
      required: false,
    }),
    reference_id: Property.Number({
      displayName: 'Reference Number',
      description:
        'The order number the merchant and customer see, for example 41027662. It is not the internal order id (2116149737); use this filter to find the internal id from the number a customer quotes.',
      required: false,
    }),
    keyword: Property.ShortText({
      displayName: 'Keyword',
      description:
        'Free-text search over customer mobile, customer name, shipping number, reference number and tag name, for example +966500000000 or Sara.',
      required: false,
    }),
    branch_ids: Property.Array({
      displayName: 'Branch IDs',
      description: 'Numeric branch IDs from List Branches, for example ["999858679"]. Leave empty for all branches.',
      required: false,
    }),
    sort_by: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field Salla sorts the results by: id, total, updated_at or created_at. Leave empty for Salla\'s default order.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Order ID', value: 'id' },
          { label: 'Total', value: 'total' },
          { label: 'Updated At', value: 'updated_at' },
          { label: 'Created At', value: 'created_at' },
        ],
      },
    }),
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of orders to return, from 1 to 200, for example 20. Default 20.',
      required: false,
      defaultValue: 20,
    }),
  },
  async run({ auth, propsValue }) {
    return sallaOrders.listOrders({
      auth,
      filters: {
        maxResults: clampMaxResults(propsValue.max_results),
        statusIds: sallaUtils.toStringList(propsValue.status_ids),
        paymentMethods: sallaUtils.toStringList(propsValue.payment_methods),
        branchIds: sallaUtils.toStringList(propsValue.branch_ids),
        fromDate: propsValue.from_date,
        toDate: propsValue.to_date,
        customerId: propsValue.customer_id ?? undefined,
        referenceId: propsValue.reference_id ?? undefined,
        keyword: propsValue.keyword,
        sortBy: toSortBy(propsValue.sort_by),
      },
    });
  },
});

function clampMaxResults(value: number | undefined | null): number {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return DEFAULT_MAX_RESULTS;
  }
  return Math.min(Math.max(Math.floor(value), 1), MAX_RESULTS_CAP);
}

function toSortBy(value: unknown): SortBy | undefined {
  return SORT_FIELDS.find((field) => field === value);
}

const DEFAULT_MAX_RESULTS = 20;
const MAX_RESULTS_CAP = 200;
const SORT_FIELDS: SortBy[] = ['id', 'total', 'updated_at', 'created_at'];

type SortBy = 'id' | 'total' | 'updated_at' | 'created_at';
