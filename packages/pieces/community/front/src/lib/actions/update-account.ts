import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateAccount = createAction({
  auth: frontAuth,
  name: 'updateAccount',
  displayName: 'Update Account',
  description: 'Update an existing account in Front.',
  props: {
    account_id: Property.ShortText({
      displayName: 'Account ID',
      description: 'The ID of the account to update.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Account Name',
      description: 'The new name for the account.',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'The new description for the account.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { account_id, name, description } = propsValue;
    const path = `/accounts/${account_id}`;
    const body: Record<string, unknown> = {};
    if (name) body['name'] = name;
    if (description) body['description'] = description;
    return await makeRequest(auth.access_token, HttpMethod.PATCH, path, body);
  },
});