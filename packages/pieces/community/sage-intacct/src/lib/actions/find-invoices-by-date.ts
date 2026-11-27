import { createAction, Property } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { QueryFilter, sageIntacctClient } from '../common/client';
import { sageIntacctRecords, sageIntacctSchemas } from '../common/output-schemas';
import { sageIntacctBodies } from '../common/props';

const RESULT_LIMIT = 500;

export const findInvoicesByDateAction = createAction({
  auth: sageIntacctAuth,
  name: 'find_invoices_by_date',
  displayName: 'Find Invoices by Date',
  description: 'Find AR invoices whose invoice date falls in a date range.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches Sage Intacct AR invoices by invoice date. from_date and to_date are strict YYYY-MM-DD dates and both are inclusive. customer_id optionally limits results to one customer (exact customer ID). Returns count, truncated (true when more than 500 invoices matched) and up to 500 records ordered oldest first, each with key, invoice number, state, dates, customer, totals and timestamps. Read-only.',
    idempotent: true,
  },
  props: {
    from_date: Property.ShortText({ displayName: 'From Date', description: 'YYYY-MM-DD, inclusive.', required: true }),
    to_date: Property.ShortText({ displayName: 'To Date', description: 'YYYY-MM-DD, inclusive.', required: true }),
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Exact customer ID, from Find Customer.',
      required: false,
    }),
  },
  outputSchema: {
    fields: [
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'truncated', label: 'Truncated', format: 'boolean' },
      { key: 'records', label: 'Invoices', labelKey: 'invoice_number', listItems: sageIntacctSchemas.invoice.fields },
    ],
  },
  async run(context) {
    const from = sageIntacctBodies.parseIsoDate({ value: context.propsValue.from_date, label: 'From Date' });
    const to = sageIntacctBodies.parseIsoDate({ value: context.propsValue.to_date, label: 'To Date' });
    if (!from || !to) {
      throw new Error('From Date and To Date are required.');
    }
    if (from > to) {
      throw new Error(`From Date (${from}) must not be after To Date (${to}).`);
    }
    const filters: QueryFilter[] = [{ $gte: { invoiceDate: from } }, { $lte: { invoiceDate: to } }];
    const customerId = sageIntacctBodies.trimmed(context.propsValue.customer_id);
    if (customerId !== undefined) {
      filters.push({ $eq: { 'customer.id': customerId } });
    }
    const { records, truncated } = await sageIntacctClient.queryAll({
      auth: context.auth,
      object: sageIntacctRecords.INVOICE_OBJECT,
      fields: sageIntacctRecords.INVOICE_QUERY_FIELDS,
      filters,
      orderBy: [{ invoiceDate: 'asc' }, { key: 'asc' }],
      limit: RESULT_LIMIT,
    });
    const mapped = records.map((record) => sageIntacctRecords.toInvoice(record));
    return { count: mapped.length, truncated, records: mapped };
  },
});
