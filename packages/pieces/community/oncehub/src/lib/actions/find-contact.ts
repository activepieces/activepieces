import { createAction, Property } from '@activepieces/pieces-framework';
import { oncehubAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findContact = createAction({
  auth: oncehubAuth,
  name: 'findContact',
  displayName: 'Find Contact',
  description: 'Search for contacts in Oncehub by various criteria',
  audience: 'both',
  aiMetadata: {
    description:
      'Look up existing OnceHub contacts filtered by email address. Use to check whether a contact already exists or to retrieve a contact before referencing it elsewhere. Read-only and repeatable; the email filter is required.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Filter contacts by email address',
      required: true,
    }),
  },
  async run(context) {
    const { email } = context.propsValue;

    const api_key = context.auth.secret_text;

    const params = new URLSearchParams();

    if (email) {
      params.append('email', email);
    }

    const queryString = params.toString();
    const path = `/contacts${queryString ? `?${queryString}` : ''}`;

    const response = await makeRequest(api_key, HttpMethod.GET, path);

    return response;
  },
});
