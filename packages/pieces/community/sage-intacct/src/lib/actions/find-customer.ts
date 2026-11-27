import { createAction, Property } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { QueryFilter, sageIntacctClient } from '../common/client';
import { sageIntacctRecords, sageIntacctSchemas } from '../common/output-schemas';

export const findCustomerAction = createAction({
  auth: sageIntacctAuth,
  name: 'find_customer',
  displayName: 'Find Customer',
  description: 'Search Sage Intacct customers by ID, name or email.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches Sage Intacct customers. search_by is "id" (exact customer ID), "name" (name contains the text) or "email" (exact default-contact email). Returns found, count and up to 100 records with key, id, name, status, contact and address fields and created/modified timestamps. Use the key with Update Customer. Read-only.',
    idempotent: true,
  },
  props: {
    search_by: Property.StaticDropdown({
      displayName: 'Search By',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Customer ID (exact)', value: 'id' },
          { label: 'Name (contains)', value: 'name' },
          { label: 'Email (exact)', value: 'email' },
        ],
      },
    }),
    search_value: Property.ShortText({ displayName: 'Search Value', required: true }),
  },
  outputSchema: sageIntacctSchemas.customerSearch,
  async run(context) {
    const value = context.propsValue.search_value.trim();
    if (value === '') {
      throw new Error('Search Value cannot be empty.');
    }
    const { records, truncated } = await sageIntacctClient.queryAll({
      auth: context.auth,
      object: sageIntacctRecords.CUSTOMER_OBJECT,
      fields: sageIntacctRecords.partyQueryFields(),
      filters: [searchFilter({ searchBy: context.propsValue.search_by, value })],
      orderBy: [{ id: 'asc' }],
      limit: 100,
    });
    const mapped = records.map((record) => sageIntacctRecords.toParty(record));
    return { found: mapped.length > 0, count: mapped.length, truncated, records: mapped };
  },
});

function searchFilter({ searchBy, value }: { searchBy: string; value: string }): QueryFilter {
  if (searchBy === 'name') {
    return { $contains: { name: value } };
  }
  if (searchBy === 'email') {
    return { $eq: { 'contacts.default.email1': value } };
  }
  if (searchBy === 'id') {
    return { $eq: { id: value } };
  }
  throw new Error('Search By must be "id", "name" or "email".');
}
