import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createAccount = createAction({
  auth: frontAuth,
  name: 'createAccount',
  displayName: 'Create Account',
  description: 'Create a new account in Front.',
  props: {
    name: Property.ShortText({
      displayName: 'Account Name',
      description: 'The name of the account to create.',
      required: true,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'A description for the account.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { name, description } = propsValue;
    const path = `/accounts`;
    const body: Record<string, unknown> = { name };
    if (description) {
      body['description'] = description;
    }
    return await makeRequest(auth.access_token, HttpMethod.POST, path, body);
  },
});
