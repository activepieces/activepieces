import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { listRecords } from '../common/client';
import { storeDropdown } from '../common/props';
import { flatFields } from '../common/output-schemas';

export const findCustomerByEmail = createAction({
  auth: lemonSqueezyAuth,
  name: 'find_customer_by_email',
  displayName: 'Find Customer by Email',
  description: 'Look up a customer by email address.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Finds a Lemon Squeezy customer by exact email address, optionally within one store. Returns found=false (not an error) when no customer matches; when the email exists in several stores, the first match is returned and all matches are listed. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: {
    fields: [
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'customer', label: 'Customer', description: 'Null when no customer matches.', children: flatFields.customer },
      { key: 'matches', label: 'All Matches', listItems: flatFields.customer, labelKey: 'name' },
    ],
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The exact customer email address.',
      required: true,
    }),
    storeId: storeDropdown({ required: false, description: 'Filter by store. Leave empty to include every store the API key can see.' }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const email = propsValue.email.trim();
    if (!email.includes('@')) throw new Error('Email must be a valid email address.');
    const result = await listRecords({
      apiKey: auth.secret_text,
      path: '/customers',
      query: {
        'filter[email]': email,
        'filter[store_id]': propsValue.storeId ? String(propsValue.storeId) : undefined,
        'page[size]': '100',
      },
    });
    return { found: result.items.length > 0, customer: result.items[0] ?? null, matches: result.items };
  },
});
