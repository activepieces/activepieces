import { createAction, Property } from '@activepieces/pieces-framework';
import { aircallAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findContact = createAction({
  auth: aircallAuth,
  name: 'findContact',
  displayName: 'Find Contact',
  description: 'Finds contact based on phone or email.',
  props: {
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description:
        'Search by phone number (with country code, e.g., +1234567890).',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Search by email address.',
      required: false,
    }),
  },
  async run(context) {
    const { phone_number, email } = context.propsValue;

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (phone_number) queryParams.set('phone_number', phone_number);
    if (email) queryParams.set('email', email);

    const queryString = queryParams.toString();
    const path = `/contacts/search${queryString ? `?${queryString}` : ''}`;

    const response = await makeRequest(context.auth, HttpMethod.GET, path);

    const { contacts } = response as { contacts: { id: number }[] };

    return {
      found: contacts.length > 0,
      data: contacts.length > 0 ? contacts[0] : {},
    };
  },
});
