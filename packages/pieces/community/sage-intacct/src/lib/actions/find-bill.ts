import { createAction, Property } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { sageIntacctClient } from '../common/client';
import { sageIntacctRecords, sageIntacctSchemas } from '../common/output-schemas';

const SEARCH_FILTERS: Record<string, string> = {
  bill_number: 'billNumber',
  vendor_id: 'vendor.id',
};

export const findBillAction = createAction({
  auth: sageIntacctAuth,
  name: 'find_bill',
  displayName: 'Find Bill',
  description: 'Find AP bills by bill number or vendor.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches Sage Intacct AP bills. search_by is "bill_number" (exact vendor bill number) or "vendor_id" (exact vendor ID, returning that vendor\'s bills). Returns found, count and up to 100 records with key, bill number, state, dates, vendor, totals and created/modified timestamps. Use the key with Update Bill. Read-only.',
    idempotent: true,
  },
  props: {
    search_by: Property.StaticDropdown({
      displayName: 'Search By',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Bill Number (exact)', value: 'bill_number' },
          { label: 'Vendor ID (exact)', value: 'vendor_id' },
        ],
      },
    }),
    search_value: Property.ShortText({ displayName: 'Search Value', required: true }),
  },
  outputSchema: sageIntacctSchemas.billSearch,
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
      object: sageIntacctRecords.BILL_OBJECT,
      fields: sageIntacctRecords.BILL_QUERY_FIELDS,
      filters: [{ $eq: { [field]: value } }],
      orderBy: [{ key: 'desc' }],
      limit: 100,
    });
    const mapped = records.map((record) => sageIntacctRecords.toBill(record));
    return { found: mapped.length > 0, count: mapped.length, truncated, records: mapped };
  },
});
