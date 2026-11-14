import { createAction, dateRangeUtils, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { OrderFilters, sallaOrders } from '../common/orders';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaUtils } from '../common/helpers';
import { sallaProps } from '../common/props';

export const findOrdersAction = createAction({
  auth: sallaAuth,
  name: 'find_orders',
  classification: 'SEARCH',
  displayName: 'Find Orders',
  description: 'Searches the store orders; with no filters it returns the latest orders.',
  audience: 'human',
  aiMetadata: {
    description:
      'Searches Salla orders by status, payment method, creation date, customer, reference number, keyword or branch and returns the matching orders. Use it to find order IDs before Get Order or Update Order Status. Read-only and safe to retry; Max Results caps the list (1 to 1000).',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.orderList,
  propertyGroups: [
    {
      key: 'status',
      display: 'builder',
      label: 'Status and Payment',
      icon: 'tag',
      props: ['statuses', 'payment_methods'],
    },
    {
      key: 'date',
      display: 'builder',
      label: 'Date',
      icon: 'calendar',
      props: ['created'],
    },
    {
      key: 'customer',
      display: 'builder',
      label: 'Customer and Order',
      icon: 'user',
      props: ['customer', 'reference_number', 'keyword'],
    },
    {
      key: 'store',
      display: 'builder',
      label: 'Store',
      icon: 'inbox',
      props: ['branches', 'sort_by'],
    },
    {
      key: 'footer',
      display: 'footer',
      icon: 'sliders',
      props: ['max_results'],
    },
  ],
  props: {
    statuses: {
      ...sallaProps.orderStatuses({
        required: false,
        description: 'Only orders in one of these statuses, including custom statuses, for example "Under Review" or "Completed".',
      }),
      icon: 'tag',
    },
    payment_methods: {
      ...sallaProps.paymentMethods({
        required: false,
        description: 'Only orders paid with one of these methods, for example mada, credit_card or cod.',
      }),
      icon: 'tag',
    },
    created: Property.DateRange({
      displayName: 'Created',
      description: 'Only orders created in this window. Salla filters by whole days in store time (Asia/Riyadh), for example 2026-11-01 to 2026-11-10.',
      display: 'dropdown',
      icon: 'calendar',
      required: false,
    }),
    customer: {
      ...sallaProps.customer({
        required: false,
        description: 'Only orders placed by this customer. Search by name or mobile, or map a customer ID such as 1227534533.',
      }),
      icon: 'user',
    },
    reference_number: Property.ShortText({
      displayName: 'Reference Number',
      description: 'The order number the customer sees, for example 41027662. This is not the internal order ID.',
      placeholder: '41027662',
      icon: 'type',
      required: false,
    }),
    keyword: Property.ShortText({
      displayName: 'Keyword',
      description: 'Matches the customer name or mobile, the shipping number, the reference number or an order tag, for example 0501234567.',
      placeholder: '0501234567',
      icon: 'text',
      required: false,
    }),
    branches: {
      ...sallaProps.branches({
        required: false,
        description: 'Only orders handled by one of these branches or warehouses.',
      }),
      icon: 'filter',
    },
    sort_by: Property.StaticDropdown<SortBy, false>({
      displayName: 'Sort By',
      description: 'Field Salla sorts the results by, for example Date created. Leave empty for Salla\'s default order.',
      icon: 'sliders',
      required: false,
      options: {
        options: [
          { label: 'Order ID', value: 'id' },
          { label: 'Date created', value: 'created_at' },
          { label: 'Date updated', value: 'updated_at' },
          { label: 'Total', value: 'total' },
        ],
      },
    }),
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'Stop after this many orders, from 1 to 1000. Default 50.',
      display: 'stepper',
      min: 1,
      max: 1000,
      step: 1,
      required: false,
      defaultValue: 50,
    }),
  },
  async run({ auth, propsValue }) {
    const { after, before } = dateRangeUtils.resolve(propsValue.created);
    const filters: OrderFilters = {
      maxResults: clampMaxResults(propsValue.max_results),
      keyword: propsValue.keyword ?? undefined,
      referenceId: sallaUtils.dropdownText(propsValue.reference_number),
      customerId: sallaUtils.dropdownText(propsValue.customer),
      fromDate: after,
      toDate: before,
      statusIds: propsValue.statuses ?? [],
      paymentMethods: propsValue.payment_methods ?? [],
      branchIds: propsValue.branches ?? [],
      sortBy: propsValue.sort_by ?? undefined,
    };
    return sallaOrders.listOrders({ auth, filters });
  },
});

function clampMaxResults(value: number | undefined | null): number {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return DEFAULT_MAX_RESULTS;
  }
  return Math.min(Math.max(Math.floor(value), 1), MAX_RESULTS_LIMIT);
}

const DEFAULT_MAX_RESULTS = 50;
const MAX_RESULTS_LIMIT = 1000;

type SortBy = NonNullable<OrderFilters['sortBy']>;
