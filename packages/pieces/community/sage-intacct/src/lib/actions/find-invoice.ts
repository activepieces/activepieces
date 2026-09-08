import { createAction, Property } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { IntacctFilter, sageIntacctClient } from '../client';

export const findInvoiceAction = createAction({
  auth: sageIntacctAuth,
  name: 'find_invoice',
  classification: 'SEARCH',
  displayName: 'Find Invoice',
  description: 'Searches for AR invoices in Sage Intacct by invoice number, customer ID, or state.',
  audience: 'both',
  aiMetadata: {
    description:
      'Search Sage Intacct AR invoices by exact invoice number, exact customer ID, or workflow state. Returns zero or more matches. Read-only, safe to retry.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'filters',
      display: 'builder',
      label: 'Filters',
      icon: 'filter',
      props: ['invoiceNumber', 'customerId', 'state'],
    },
    {
      key: 'footer',
      display: 'footer',
      props: ['maxResults'],
    },
  ],
  props: {
    invoiceNumber: Property.ShortText({
      displayName: 'Invoice Number',
      description: 'Filter by exact invoice number, e.g. "SI-0034".',
      required: false,
      icon: 'tag',
    }),
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Filter by exact customer ID, e.g. "CUST-002".',
      required: false,
      icon: 'user',
    }),
    state: Property.StaticDropdown({
      displayName: 'State',
      required: false,
      icon: 'filter',
      options: {
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Posted', value: 'posted' },
          { label: 'Paid', value: 'paid' },
          { label: 'Partially Paid', value: 'partiallyPaid' },
          { label: 'Reversed', value: 'reversed' },
        ],
      },
    }),
    maxResults: Property.Number({
      displayName: 'Max results',
      required: false,
      defaultValue: 10,
      display: 'stepper',
      min: 1,
      max: 200,
    }),
  },
  async run(context) {
    const { invoiceNumber, customerId, state, maxResults } = context.propsValue;
    const filters: IntacctFilter[] = [];
    if (invoiceNumber) filters.push({ $eq: { invoiceNumber } });
    if (customerId) filters.push({ $eq: { 'customer.id': customerId } });
    if (state) filters.push({ $eq: { state } });

    const { records } = await sageIntacctClient.query<InvoiceRecord>({
      accessToken: context.auth.access_token,
      object: sageIntacctClient.objects.arInvoice,
      fields: [
        'key',
        'id',
        'invoiceNumber',
        'referenceNumber',
        'state',
        'invoiceDate',
        'dueDate',
        'totalTxnAmount',
        'totalTxnAmountDue',
      ],
      ...(filters.length > 0 ? { filters } : {}),
      orderBy: [{ invoiceDate: 'desc' }],
      size: maxResults ?? 10,
    });

    return records;
  },
});

type InvoiceRecord = {
  key: string;
  id: string;
  invoiceNumber: string | null;
  referenceNumber: string | null;
  state: string;
  invoiceDate: string;
  dueDate: string;
  totalTxnAmount: number | null;
  totalTxnAmountDue: number | null;
};
