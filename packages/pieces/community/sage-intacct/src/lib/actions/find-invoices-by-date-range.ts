import { createAction, Property, dateRangeUtils } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { IntacctFilter, sageIntacctClient } from '../client';

type InvoiceRecord = {
  key: string;
  id: string;
  invoiceNumber: string | null;
  state: string;
  invoiceDate: string;
  dueDate: string;
  totalTxnAmount: number | null;
  totalTxnAmountDue: number | null;
};

export const findInvoicesByDateRangeAction = createAction({
  auth: sageIntacctAuth,
  name: 'find_invoices_by_date_range',
  classification: 'SEARCH',
  displayName: 'Find Invoices (by Date Range)',
  description: 'Searches for AR invoices in Sage Intacct within a given invoice date range.',
  audience: 'both',
  aiMetadata: {
    description:
      'Search Sage Intacct AR invoices whose invoice date falls within a given date window. Use for date-bounded reporting instead of Find Invoice, which filters by number/customer/state. Returns zero or more matches. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    dateRange: Property.DateRange({
      displayName: 'Invoice Date',
      description: 'Only return invoices dated within this range.',
      required: true,
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
    const { dateRange, maxResults } = context.propsValue;
    const { after, before } = dateRangeUtils.resolve(dateRange);

    const filters: IntacctFilter[] = [];
    if (after && before) {
      filters.push({
        $between: { invoiceDate: [sageIntacctClient.toDate(after), sageIntacctClient.toDate(before)] },
      });
    } else if (after) {
      filters.push({ $gte: { invoiceDate: sageIntacctClient.toDate(after) } });
    } else if (before) {
      filters.push({ $lte: { invoiceDate: sageIntacctClient.toDate(before) } });
    }

    const { records } = await sageIntacctClient.query<InvoiceRecord>({
      accessToken: context.auth.access_token,
      object: sageIntacctClient.objects.arInvoice,
      fields: [
        'key',
        'id',
        'invoiceNumber',
        'state',
        'invoiceDate',
        'dueDate',
        'totalTxnAmount',
        'totalTxnAmountDue',
      ],
      ...(filters.length > 0 ? { filters } : {}),
      orderBy: [{ invoiceDate: 'asc' }],
      size: maxResults ?? 10,
    });

    return records;
  },
});
