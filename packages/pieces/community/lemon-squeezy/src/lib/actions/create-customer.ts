import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { createRecord, numericId } from '../common/client';
import { storeDropdown } from '../common/props';
import { countryCode } from '../common/validation';
import { flatFields, recordSchema } from '../common/output-schemas';

export const createCustomer = createAction({
  auth: lemonSqueezyAuth,
  name: 'create_customer',
  displayName: 'Create Customer',
  description: 'Create a customer in a store.',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a customer record in a Lemon Squeezy store with a name and email, and optionally city, region and 2-letter country code. Not idempotent: Lemon Squeezy rejects a second customer with the same email in the same store, so look the email up first with Find Customer by Email.',
    idempotent: false,
  },
  outputSchema: recordSchema(flatFields.customer),
  props: {
    storeId: storeDropdown({ required: true, description: 'The store to create the customer in.' }),
    name: Property.ShortText({ displayName: 'Name', description: 'The customer\'s full name.', required: true }),
    email: Property.ShortText({ displayName: 'Email', description: 'The customer\'s email address.', required: true }),
    city: Property.ShortText({ displayName: 'City', required: false }),
    region: Property.ShortText({ displayName: 'Region', description: 'State, county or region.', required: false }),
    country: Property.ShortText({ displayName: 'Country', description: 'ISO 3166-1 alpha-2 country code, for example US or DE.', required: false }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const storeId = numericId({ value: propsValue.storeId, label: 'Store' });
    const attributes: Record<string, unknown> = { name: propsValue.name, email: propsValue.email };
    if (propsValue.city) attributes['city'] = propsValue.city;
    if (propsValue.region) attributes['region'] = propsValue.region;
    if (propsValue.country) attributes['country'] = countryCode(propsValue.country);
    return createRecord({
      apiKey: auth.secret_text,
      path: '/customers',
      type: 'customers',
      attributes,
      relationships: { store: { data: { type: 'stores', id: storeId } } },
    });
  },
});
