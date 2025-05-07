import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { quickbooksAuth } from '../auth';
import { quickbooksCommon, QuickbooksEntityResponse } from '../common';
import { QuickbooksCustomer, QuickbooksInvoice } from '../types';

export const findInvoice = createAction({
  name: 'find_invoice',
  displayName: 'Find Invoice',
  description: 'Find an invoice in QuickBooks',
  auth: quickbooksAuth,
  props: {
    invoice_id: Property.ShortText({
      displayName: 'Invoice ID',
      description: 'The ID of the specific invoice to retrieve. If provided, other search parameters will be ignored.',
      required: false,
    }),
    customer_id: Property.Dropdown({
      displayName: 'Customer',
      description: 'Filter invoices by customer',
      required: false,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first',
            options: [],
          };
        }

        try {
          const authData = auth as OAuth2PropertyValue;
          const query = quickbooksCommon.buildQuery('Customer', ['Active = true'], 'DisplayName', 100);

          const response = await quickbooksCommon.makeRequest<QuickbooksEntityResponse<QuickbooksCustomer>>({
            auth: authData,
            method: HttpMethod.GET,
            path: 'query',
            query: { query },
          });

          if (response.Fault) {
            throw new Error(`QuickBooks API Error: ${response.Fault.Error.map(e => e.Message).join(', ')}`);
          }

          const customers = response.QueryResponse?.['Customer'] as QuickbooksCustomer[] || [];

          return {
            options: Array.isArray(customers) ? customers.map((customer: QuickbooksCustomer) => ({
              label: customer.DisplayName,
              value: customer.Id,
            })) : [],
          };
        } catch (error) {
          console.error('Error fetching customers:', error);
          return {
            disabled: true,
            placeholder: 'Error fetching customers',
            options: [],
          };
        }
      },
    }),
    invoice_status: Property.StaticDropdown({
      displayName: 'Invoice Status',
      description: 'Filter invoices by status',
      required: false,
      options: {
        options: [
          { label: 'All Invoices', value: 'all' },
          { label: 'Unpaid Invoices', value: 'unpaid' },
          { label: 'Paid Invoices', value: 'paid' },
          { label: 'Overdue Invoices', value: 'overdue' },
        ],
      },
      defaultValue: 'all',
    }),
    date_range: Property.StaticDropdown({
      displayName: 'Date Range',
      description: 'Filter invoices by date range',
      required: false,
      options: {
        options: [
          { label: 'All Dates', value: 'all' },
          { label: 'Last 30 Days', value: 'last30' },
          { label: 'Last 90 Days', value: 'last90' },
          { label: 'This Year', value: 'thisyear' },
          { label: 'Last Year', value: 'lastyear' },
        ],
      },
      defaultValue: 'all',
    }),
    max_results: Property.Number({
      displayName: 'Maximum Results',
      description: 'Maximum number of results to return (default: 20, max: 1000)',
      required: false,
      defaultValue: 20,
    }),
  },
  async run({ auth, propsValue }) {
    const { invoice_id, customer_id, invoice_status, date_range, max_results } = propsValue;

    // If invoice_id is provided, get that specific invoice
    if (invoice_id) {
      const response = await quickbooksCommon.makeRequest<{ Invoice: QuickbooksInvoice }>({
        auth: auth,
        method: HttpMethod.GET,
        path: `invoice/${invoice_id}`,
      });

      return response;
    }

    // Build the query conditions
    const conditions: string[] = [];

    if (customer_id) {
      conditions.push(`CustomerRef.value = '${customer_id}'`);
    }

    // Add status conditions
    if (invoice_status === 'unpaid') {
      conditions.push('Balance > 0');
    } else if (invoice_status === 'paid') {
      conditions.push('Balance = 0');
    } else if (invoice_status === 'overdue') {
      const today = new Date().toISOString().split('T')[0];
      conditions.push(`Balance > 0 AND DueDate < '${today}'`);
    }

    // Add date range conditions
    if (date_range && date_range !== 'all') {
      const today = new Date();
      let dateCondition = '';

      if (date_range === 'last30') {
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        dateCondition = `TxnDate >= '${startDate.toISOString().split('T')[0]}'`;
      } else if (date_range === 'last90') {
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 90);
        dateCondition = `TxnDate >= '${startDate.toISOString().split('T')[0]}'`;
      } else if (date_range === 'thisyear') {
        const startDate = new Date(today.getFullYear(), 0, 1);
        dateCondition = `TxnDate >= '${startDate.toISOString().split('T')[0]}'`;
      } else if (date_range === 'lastyear') {
        const startDate = new Date(today.getFullYear() - 1, 0, 1);
        const endDate = new Date(today.getFullYear() - 1, 11, 31);
        dateCondition = `TxnDate >= '${startDate.toISOString().split('T')[0]}' AND TxnDate <= '${endDate.toISOString().split('T')[0]}'`;
      }

      if (dateCondition) {
        conditions.push(dateCondition);
      }
    }

    // Build the query
    const query = quickbooksCommon.buildQuery(
      'Invoice',
      conditions,
      'TxnDate DESC',
      Math.min(max_results || 20, 1000)
    );

    // Make the request to search for invoices
    const response = await quickbooksCommon.makeRequest<QuickbooksEntityResponse<QuickbooksInvoice>>({
      auth: auth,
      method: HttpMethod.GET,
      path: 'query',
      query: { query },
    });

    return response;
  },
});
