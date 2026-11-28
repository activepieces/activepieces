import { createAction, Property } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { sageIntacctClient } from '../common/client';
import { sageIntacctRecords, sageIntacctSchemas } from '../common/output-schemas';

const SEARCH_FILTERS: Record<string, string> = {
  invoice_number: 'invoiceNumber',
  customer_id: 'customer.id',
};

export const findInvoiceAction = createAction({
  auth: sageIntacctAuth,
  name: 'find_invoice',
  displayName: 'Find Invoice',
  description: 'Find AR invoices by invoice number or customer.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches Sage Intacct AR invoices. search_by is "invoice_number" (exact invoice number) or "customer_id" (exact customer ID, returning that customer\'s invoices). Returns found, count and up to 100 records with key, invoice number, state, dates, customer, totals and created/modified timestamps. Use the key with Update Invoice. Read-only.',
    idempotent: true,
  },
  props: {
    search_by: Property.StaticDropdown({
      displayName: 'Search By',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Invoice Number (exact)', value: 'invoice_number' },
          { label: 'Customer ID (exact)', value: 'customer_id' },
        ],
      },
    }),
    search_value: Property.ShortText({ displayName: 'Search Value', required: true }),
  },
  outputSchema: sageIntacctSchemas.invoiceSearch,
  async run(context) {
    const value = context.propsValue.search_value.trim();
    if (value === '') {
      throw new Error('Search Value cannot be empty.');
    }
    const field = SEARCH_FILTERS[context.propsValue.search_by];
    if (!field) {
      throw new Error(`Unknown search_by value "${context.propsValue.search_by}".`);
    }
    const { records, truncated } = await sageIntacctClient.queryAll({
      auth: context.auth,
      object: sageIntacctRecords.INVOICE_OBJECT,
      fields: sageIntacctRecords.INVOICE_QUERY_FIELDS,
      filters: [{ $eq: { [field]: value } }],
      orderBy: [{ key: 'desc' }],
      limit: 100,
    });
    const mapped = records.map((record) => sageIntacctRecords.toInvoice(record));
    return { found: mapped.length > 0, count: mapped.length, truncated, records: mapped };
  },
});
