import { createAction, Property } from '@activepieces/pieces-framework';
import { mollieAuth } from '../..';
import { mollieCommon } from '../common';

export const mollieSearchOrder = createAction({
  auth: mollieAuth,
  name: 'search_order',
  displayName: 'Search Order',
  description: 'Search for orders by various criteria',
  props: {
    searchBy: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'The criteria to search by',
      required: true,
      options: {
        options: [
          { label: 'Order ID', value: 'id' },
          { label: 'Status', value: 'status' },
          { label: 'Date Range', value: 'dateRange' },
          { label: 'All Orders', value: 'all' },
        ],
      },
    }),
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      description: 'The value to search for (Order ID)',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The order status to filter by',
      required: false,
      options: {
        options: [
          { label: 'Created', value: 'created' },
          { label: 'Pending', value: 'pending' },
          { label: 'Authorized', value: 'authorized' },
          { label: 'Canceled', value: 'canceled' },
          { label: 'Shipping', value: 'shipping' },
          { label: 'Completed', value: 'completed' },
          { label: 'Expired', value: 'expired' },
          { label: 'Paid', value: 'paid' },
        ],
      },
    }),
    fromDate: Property.ShortText({
      displayName: 'From Date',
      description: 'Start date for date range search (ISO 8601 format)',
      required: false,
    }),
    toDate: Property.ShortText({
      displayName: 'To Date',
      description: 'End date for date range search (ISO 8601 format)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { searchBy, searchValue, status, fromDate, toDate, limit } = context.propsValue;

    if (searchBy === 'id' && searchValue) {
      try {
        const order = await mollieCommon.getResource(
          context.auth,
          'orders',
          searchValue
        );
        return { orders: [order], count: 1 };
      } catch (error) {
        return { orders: [], count: 0, error: 'Order not found' };
      }
    }

    const queryParams: any = {
      limit: limit || 20,
    };

    if (searchBy === 'status' && status) {
      queryParams.status = status;
    }

    if (searchBy === 'dateRange') {
      if (fromDate) {
        queryParams.from = fromDate;
      }
      if (toDate) {
        queryParams.to = toDate;
      }
    }

    const result = await mollieCommon.listResources(
      context.auth,
      'orders',
      queryParams
    );

    return {
      orders: result._embedded?.orders || [],
      count: result.count || 0,
    };
  },
});