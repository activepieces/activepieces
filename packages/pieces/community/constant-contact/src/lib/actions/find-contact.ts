import { Property, createAction } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../auth';
import { CONTACT_INCLUDE, ccClient } from '../common/client';
import { findContactOutputSchema } from '../common/output-schemas';
import { ccInput } from '../common/props';
import { ccData } from '../common/types';

export const findContact = createAction({
  auth: constantContactAuth,
  name: 'find_contact',
  classification: 'READ',
  displayName: 'Find Contact by Email',
  description: 'Looks up a contact by email address. Returns found = false instead of failing when there is no match. Deleted contacts are not returned.',
  audience: 'human',
  aiMetadata: {
    description: 'Looks up one Constant Contact contact by exact email and returns it with lists, tags and custom fields, or found=false.',
    idempotent: true,
  },
  outputSchema: findContactOutputSchema,
  props: {
    email: Property.ShortText({ displayName: 'Email', description: 'The email address of the contact.', required: true }),
  },
  async run({ auth, propsValue }) {
    const email = ccInput.optionalText(propsValue.email);
    if (email === undefined) {
      throw new Error('Email is required.');
    }
    const response = await ccClient.request({
      accessToken: auth.access_token,
      method: 'GET',
      path: '/contacts',
      operation: 'find contact',
      query: { email, include: CONTACT_INCLUDE },
    });
    const contact = ccData
      .recordsAt({ value: response.body, key: 'contacts' })
      .find((item) => (ccData.textAt({ value: ccData.recordAt({ value: item, key: 'email_address' }), key: 'address' }) ?? '').toLowerCase() === email.toLowerCase());
    return contact === undefined ? { found: false, contact: null } : { found: true, contact };
  },
});
