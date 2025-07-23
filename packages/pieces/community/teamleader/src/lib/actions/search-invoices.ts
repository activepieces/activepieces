import { createAction, Property } from '@activepieces/pieces-framework';
import { teamleaderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchInvoices = createAction({
  auth: teamleaderAuth,
  name: 'searchInvoices',
  displayName: 'Search Invoices',
  description: 'Search for invoices in Teamleader',
  props: {
    term: Property.ShortText({
      displayName: 'Search Term',
      description: 'Search by invoice number',
      required: false,
    }),
    companyId: Property.ShortText({
      displayName: 'Company ID',
      description: 'Filter invoices by company',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter invoices by status',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Sent', value: 'sent' },
          { label: 'Paid', value: 'paid' },
          { label: 'Reminded', value: 'reminded' },
          { label: 'Late', value: 'late' },
        ],
      },
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'Filter invoices by due date',
      required: false,
    }),
    invoicedAfter: Property.DateTime({
      displayName: 'Invoiced After',
      description: 'Filter invoices created after this date',
      required: false,
    }),
    invoicedBefore: Property.DateTime({
      displayName: 'Invoiced Before',
      description: 'Filter invoices created before this date',
      required: false,
    }),
    updatedSince: Property.DateTime({
      displayName: 'Updated Since',
      description: 'Filter invoices updated since a specific date',
      required: false,
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Sort the results by a specific field',
      required: false,
      options: {
        options: [
          { label: 'Invoice Number', value: 'invoice_number' },
          { label: 'Due Date', value: 'due_on' },
          { label: 'Invoiced Date', value: 'invoiced_on' },
          { label: 'Created At', value: 'created_at' },
          { label: 'Updated At', value: 'updated_at' },
        ],
      },
    }),
    sortOrder: Property.StaticDropdown({
      displayName: 'Sort Order',
      description: 'Order of the sorted results',
      required: false,
      options: {
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
      },
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination',
      required: false,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Number of results per page (max 100)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const requestBody: Record<string, unknown> = {
      page: {
        size: propsValue.pageSize || 20,
        number: propsValue.page || 1,
      },
    };

    // Build filter object
    const filter: Record<string, unknown> = {};
    if (propsValue.term) {
      filter['term'] = propsValue.term;
    }
    if (propsValue.companyId) {
      filter['company_id'] = propsValue.companyId;
    }
    if (propsValue.status) {
      filter['status'] = propsValue.status;
    }
    if (propsValue.dueDate) {
      filter['due_on'] = propsValue.dueDate;
    }
    if (propsValue.invoicedAfter) {
      filter['invoiced_after'] = propsValue.invoicedAfter;
    }
    if (propsValue.invoicedBefore) {
      filter['invoiced_before'] = propsValue.invoicedBefore;
    }
    if (propsValue.updatedSince) {
      filter['updated_since'] = propsValue.updatedSince;
    }

    // Only add filter if there are filter conditions
    if (Object.keys(filter).length > 0) {
      requestBody['filter'] = filter;
    }

    // Add sorting if specified
    if (propsValue.sortBy) {
      requestBody['sort'] = [
        {
          field: propsValue.sortBy,
          order: propsValue.sortOrder || 'asc',
        },
      ];
    }

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/invoices.list',
      requestBody
    );

    return response;
  },
});
