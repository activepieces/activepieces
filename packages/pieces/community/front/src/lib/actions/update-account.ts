import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { accountDropdown } from '../common/props';

export const updateAccount = createAction({
  auth: frontAuth,
  name: 'update_account',
  displayName: 'Update Account',
  description: 'Update fields of an existing Account.',
  props: {
    account_id: accountDropdown,
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The new name for the account.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The new description for the account.',
      required: false,
    }),
    domains: Property.Array({
      displayName: 'Domains',
      description: 'A list of domains to associate with the account. This will overwrite existing domains.',
      required: false,
    }),
    custom_fields: Property.Json({
        displayName: 'Custom Fields',
        description: 'Custom fields to add or update. Existing fields will be preserved.',
        required: false,
    })
  },
  async run(context) {
    const { account_id, name, description, domains, custom_fields } = context.propsValue;
    const token = context.auth;
    const body: Record<string, unknown> = {};


    if (name !== undefined) body['name'] = name;
    if (description !== undefined) body['description'] = description;
    if (domains !== undefined) body['domains'] = domains;


    if (custom_fields && typeof custom_fields === 'object' && Object.keys(custom_fields).length > 0) {

        const currentAccount = await makeRequest<{ custom_fields: Record<string, unknown> }>(
            token,
            HttpMethod.GET,
            `/accounts/${account_id}`
        );
        
        // 2. Merge existing custom fields with the new ones
        const existingCustomFields = currentAccount.custom_fields || {};
        body['custom_fields'] = { ...existingCustomFields, ...custom_fields };
    }

    return await makeRequest(
        token,
        HttpMethod.PATCH,
        `/accounts/${account_id}`,
        body
    );
  },
});

