import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { helpScoutApi } from '../common/api';
import { helpScoutAuth } from '../common/auth';
import { helpScoutOutputSchemas } from '../common/output-schemas';

export const findCustomer = createAction({
  auth: helpScoutAuth,
  name: 'find_customer',
  classification: 'SEARCH',
  displayName: 'Find Customer',
  description: 'Finds a customer by email.',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up a Help Scout customer by exact email and returns the first match with a found flag (found=false and empty data when none). Use to resolve a customer ID before creating a customer, reading it with Get Customer, or creating a conversation. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: helpScoutOutputSchemas['findCustomer'],
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The customer email address, for example jane@example.com.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const email = propsValue.email.trim();
    if (!email) {
      throw new Error('Provide the customer email to search for.');
    }
    const response = await helpScoutApi.request({
      method: HttpMethod.GET,
      path: '/customers',
      auth,
      queryParams: { query: `(email:"${helpScoutApi.escapeQueryValue(email)}")` },
    });
    return helpScoutApi.findFirst({ body: response.body, key: 'customers' });
  },
});
