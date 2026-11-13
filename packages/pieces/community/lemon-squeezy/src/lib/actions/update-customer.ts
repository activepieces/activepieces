import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { numericId, patchRecord, seg } from '../common/client';
import { countryCode } from '../common/validation';
import { flatFields, recordSchema } from '../common/output-schemas';

export const updateCustomer = createAction({
  auth: lemonSqueezyAuth,
  name: 'update_customer',
  displayName: 'Update Customer',
  description: "Update a customer's details or archive the customer.",
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates a Lemon Squeezy customer by ID: name, email, city, region, country (2-letter code), or archives the customer. Only the fields you provide change; at least one is required. Idempotent: repeating the same update leaves the customer unchanged.',
    idempotent: true,
  },
  outputSchema: recordSchema(flatFields.customer),
  props: {
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The numeric ID of the customer.',
      required: true,
    }),
    name: Property.ShortText({ displayName: 'Name', description: 'The customer\'s full name.', required: false }),
    email: Property.ShortText({ displayName: 'Email', description: 'The customer\'s email address.', required: false }),
    city: Property.ShortText({ displayName: 'City', required: false }),
    region: Property.ShortText({ displayName: 'Region', description: 'State, county or region.', required: false }),
    country: Property.ShortText({ displayName: 'Country', description: 'ISO 3166-1 alpha-2 country code, for example US or DE.', required: false }),
    archive: Property.Checkbox({
      displayName: 'Archive Customer',
      description: 'Archive the customer (it can be restored in the dashboard).',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const id = numericId({ value: propsValue.customerId, label: 'Customer ID' });
    const attributes: Record<string, unknown> = {};
    if (propsValue.name) attributes['name'] = propsValue.name;
    if (propsValue.email) attributes['email'] = propsValue.email;
    if (propsValue.city) attributes['city'] = propsValue.city;
    if (propsValue.region) attributes['region'] = propsValue.region;
    if (propsValue.country) attributes['country'] = countryCode(propsValue.country);
    if (propsValue.archive === true) attributes['status'] = 'archived';
    if (Object.keys(attributes).length === 0) {
      throw new Error('Nothing to update: provide at least one field or tick Archive Customer.');
    }
    return patchRecord({ apiKey: auth.secret_text, type: 'customers', path: `/customers/${seg({ value: id, label: 'Customer ID' })}`, id: id, attributes: attributes });
  },
});
