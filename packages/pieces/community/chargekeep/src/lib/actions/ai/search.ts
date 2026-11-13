import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { chargekeepAuth } from '../../auth';
import { chargekeepClient } from '../../common/client';
import { chargekeepMappers } from '../../common/mappers';
import { chargekeepOutputSchemas } from '../../common/output-schemas';

const MAX_LIMIT = 100;

function limitOf(value: unknown): number {
  const n = value === undefined || value === null || value === '' ? 20 : Number(value);
  if (!Number.isInteger(n) || n < 1) throw new Error('Limit must be a whole number of at least 1.');
  return Math.min(n, MAX_LIMIT);
}

export const searchContacts = createAction({
  auth: chargekeepAuth,
  name: 'search_contacts',
  classification: 'SEARCH',
  displayName: 'Search Contacts',
  description: 'Find contacts by name, email or phone.',
  audience: 'ai',
  aiMetadata: {
    description: 'Searches ChargeKeep/Sperse CRM contacts by a phrase (name, email or phone fragment) and returns up to limit matches (default 20, max 100) with contactId, name, email and city. Not paginated: when mayHaveMore is true, use a more specific phrase. Use Get Contact Details with the contactId for the full record. Read-only.',
    idempotent: true,
  },
  outputSchema: chargekeepOutputSchemas.contactSearch,
  props: {
    phrase: Property.ShortText({ displayName: 'Search Phrase', required: true }),
    limit: Property.Number({ displayName: 'Limit', description: 'Default 20, max 100.', required: false }),
  },
  async run({ auth, propsValue }) {
    const phrase = chargekeepClient.text(propsValue.phrase);
    if (!phrase) throw new Error('Search Phrase is required.');
    const limit = limitOf(propsValue.limit);
    const result = await chargekeepClient.request({ auth, method: HttpMethod.GET, path: '/api/services/CRM/Contact/GetAllByPhrase', query: { SearchPhrase: phrase, TopCount: limit } });
    const items = chargekeepMappers.records(result).map(chargekeepMappers.contactSearchItem);
    return { items, count: items.length, mayHaveMore: items.length >= limit };
  },
});

export const listProducts = createAction({
  auth: chargekeepAuth,
  name: 'list_products',
  classification: 'SEARCH',
  displayName: 'Find Products',
  description: 'Find products by name or SKU.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists ChargeKeep/Sperse CRM products whose name or SKU matches an optional phrase, up to limit (default 20, max 100), with productId, SKU (code), type and payment options (priceOptionId, unit, price). Leave phrase empty to list products. Not paginated: when mayHaveMore is true, use a more specific phrase. Use the SKU as productCode in invoices and subscriptions. Read-only.',
    idempotent: true,
  },
  outputSchema: chargekeepOutputSchemas.productList,
  props: {
    phrase: Property.ShortText({ displayName: 'Search Phrase', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: 'Default 20, max 100.', required: false }),
  },
  async run({ auth, propsValue }) {
    const limit = limitOf(propsValue.limit);
    const result = await chargekeepClient.request({ auth, method: HttpMethod.GET, path: '/api/services/CRM/Product/GetProductsByPhrase', query: { SearchPhrase: chargekeepClient.text(propsValue.phrase), TopCount: limit } });
    const items = chargekeepMappers.records(result).map(chargekeepMappers.productListItem);
    return { items, count: items.length, mayHaveMore: items.length >= limit };
  },
});

export const listContactGroups = createAction({
  auth: chargekeepAuth,
  name: 'list_contact_groups',
  classification: 'SEARCH',
  displayName: 'List Contact Groups',
  description: 'List the contact groups (Client, Partner, ...) of the account.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists the contact groups configured in ChargeKeep/Sperse CRM as {id, name} pairs (e.g. C Client, P Partner, V Vendor). Read-only.',
    idempotent: true,
  },
  outputSchema: chargekeepOutputSchemas.contactGroups,
  props: {},
  async run({ auth }) {
    const result = await chargekeepClient.request({ auth, method: HttpMethod.GET, path: '/api/services/CRM/Contact/GetContactGroups' });
    const items = chargekeepMappers.records(result).map(chargekeepMappers.contactGroup);
    return { items, count: items.length };
  },
});
