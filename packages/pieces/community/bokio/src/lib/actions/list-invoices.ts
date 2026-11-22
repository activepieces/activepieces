import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bokioAuth } from '../common/auth';
import { bokioClient } from '../common/client';
import { bokioBuilders } from '../common/builders';
import { bokioSchemas } from '../common/schemas';
import { bokioProps } from '../common/props';

export const listInvoices = createAction({
  auth: bokioAuth,
  name: 'list_invoices',
  classification: 'SEARCH',
  displayName: 'List Invoices',
  description: 'Lists invoices, optionally filtered by status, customer and invoice date.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists invoices in a Bokio company one page at a time, optionally filtered by status (draft, published, paid, overdue, ...), customer ID and an invoice date range (YYYY-MM-DD, inclusive). Returns items plus totalItems, totalPages and currentPage; pageSize is 1 to 100 (default 25). Use it to find invoice ids for Get Invoice, Add Invoice Line Item, Update Draft Invoice or Publish Invoice. Read-only.',
    idempotent: true,
  },
  outputSchema: bokioSchemas.invoicePage,
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Only invoices with this status',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Published', value: 'published' },
          { label: 'Paid', value: 'paid' },
          { label: 'Over Paid', value: 'overPaid' },
          { label: 'Under Paid', value: 'underPaid' },
          { label: 'Overdue', value: 'overdue' },
          { label: 'Credited', value: 'credited' },
          { label: 'Credit', value: 'credit' },
        ],
      },
    }),
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      placeholder: 'e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6',
      description: 'Only invoices for this customer. Customer UUID. Get it from Find Customer, Get Draft Invoice by Customer Name, or the output of Create Customer.',
      required: false,
    }),
    invoiceDateFrom: Property.ShortText({
      displayName: 'Invoice Date From',
      description: 'YYYY-MM-DD, inclusive',
      required: false,
    }),
    invoiceDateTo: Property.ShortText({
      displayName: 'Invoice Date To',
      description: 'YYYY-MM-DD, inclusive',
      required: false,
    }),
    ...bokioProps.pageProps(),
  },
  async run(context) {
    const p = context.propsValue;
    const query = bokioClient.buildFilter([
      { field: 'status', operator: '==', value: bokioBuilders.optionalText(p.status) },
      { field: 'customerRef.id', operator: '==', value: bokioBuilders.optionalUuid({ value: p.customerId, kind: 'customer' }) },
      {
        field: 'invoiceDate',
        operator: '>=',
        value: bokioBuilders.optionalDate({ value: p.invoiceDateFrom, field: 'Invoice date from' }),
      },
      {
        field: 'invoiceDate',
        operator: '<=',
        value: bokioBuilders.optionalDate({ value: p.invoiceDateTo, field: 'Invoice date to' }),
      },
    ]);
    const body = await bokioClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/invoices',
      operation: 'list invoices',
      queryParams: bokioClient.listParams({ page: p.page, pageSize: p.pageSize, query }),
    });
    return bokioClient.normalizePage<unknown>(body);
  },
});
