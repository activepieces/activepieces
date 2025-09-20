import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findContact = createAction({
  auth: frontAuth,
  name: 'findContact',
  displayName: 'Find Contact',
  description: 'Look up a contact by handle (email, phone, etc.) or other identifying field.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address to search for.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Phone number to search for.',
      required: false,
    }),
    custom_query: Property.ShortText({
      displayName: 'Custom Query',
      description: 'Custom Front query string (advanced).',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of contacts to return.',
      required: false,
    }),
    page_token: Property.ShortText({
      displayName: 'Page Token',
      description: 'Token for pagination.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { email, phone, custom_query, limit, page_token } = propsValue;
    const params: string[] = [];

    if (email) params.push(`q[handles]=${encodeURIComponent(email)}`);
    if (phone) params.push(`q[handles]=${encodeURIComponent(phone)}`);
    if (custom_query) params.push(`q=${encodeURIComponent(custom_query)}`);
    if (limit) params.push(`limit=${limit}`);
    if (page_token) params.push(`page_token=${encodeURIComponent(page_token)}`);

    const queryString = params.length ? `?${params.join('&')}` : '';
    const path = `/contacts${queryString}`;

    return await makeRequest(auth.access_token, HttpMethod.GET, path);
  },
});