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
        description: 'Custom fields to update. Note: This will replace all existing custom fields.',
        required: false,
    })
  },
  async run(context) {
    const { account_id, ...body } = context.propsValue;
    const token = context.auth;

    // Remove undefined properties so we only send the fields the user wants to update
    Object.keys(body).forEach(key => {
        if (body[key as keyof typeof body] === undefined) {
            delete body[key as keyof typeof body];
        }
    });

    return await makeRequest(
        token,
        HttpMethod.PATCH,
        `/accounts/${account_id}`,
        body
    );
  },
});