import { createAction, Property } from '@activepieces/pieces-framework';
import { mollieAuth } from '../..';
import { mollieCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const mollieSearchPayment = createAction({
  auth: mollieAuth,
  name: 'search_payment',
  displayName: 'Search Payment',
  description: 'Search for payments by various criteria',
  props: {
    searchBy: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'The criteria to search by',
      required: true,
      options: {
        options: [
          { label: 'Payment ID', value: 'id' },
          { label: 'Customer ID', value: 'customerId' },
          { label: 'Status', value: 'status' },
          { label: 'Date Range', value: 'dateRange' },
        ],
      },
    }),
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      description: 'The value to search for (Payment ID or Customer ID)',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The payment status to filter by',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Canceled', value: 'canceled' },
          { label: 'Pending', value: 'pending' },
          { label: 'Authorized', value: 'authorized' },
          { label: 'Expired', value: 'expired' },
          { label: 'Failed', value: 'failed' },
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
        const payment = await mollieCommon.getResource(
          context.auth,
          'payments',
          searchValue
        );
        return { payments: [payment], count: 1 };
      } catch (error) {
        return { payments: [], count: 0, error: 'Payment not found' };
      }
    }

    const queryParams: any = {
      limit: limit || 20,
    };

    if (searchBy === 'customerId' && searchValue) {
      const customerPayments = await mollieCommon.makeRequest(
        context.auth,
        HttpMethod.GET,
        `/customers/${searchValue}/payments`,
        undefined,
        queryParams
      );
      return {
        payments: customerPayments._embedded?.payments || [],
        count: customerPayments.count || 0,
      };
    }

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
      'payments',
      queryParams
    );

    return {
      payments: result._embedded?.payments || [],
      count: result.count || 0,
    };
  },
});