import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { accountIdDropdown } from '../common/dropdown';

export const updateAccount = createAction({
  auth: frontAuth,
  name: 'updateAccount',
  displayName: 'Update Account',
  description: 'Update an existing account in Front.',
  props: {
    account_id: accountIdDropdown,
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
    domains: Property.Array({
      displayName: 'Domains',
      description: 'List of domains associated with the account.',
      required: false,
    }),
    custom_fields: Property.Json({
      displayName: 'Custom Fields',
      description:
        'Custom fields to add or update. Existing fields will be preserved.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { account_id, name, description, domains, custom_fields } =
      propsValue;
    const path = `/accounts/${account_id}`;
    const body: Record<string, unknown> = {};
    if (name) body['name'] = name;
    if (description) body['description'] = description;
    if (domains) body['domains'] = domains;
    if (custom_fields) body['custom_fields'] = custom_fields;
    return await makeRequest(auth, HttpMethod.PATCH, path, body);
  },
});
