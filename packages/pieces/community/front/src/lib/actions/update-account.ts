import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { frontProps } from '../common/props';

export const updateAccount = createAction({
  auth: frontAuth,
  name: 'update_account',
  displayName: 'Update Account',
  description: 'Update fields of an existing Account.',
  props: {
    account_id: frontProps.account(), 
    name: Property.ShortText({
      displayName: 'Account Name',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    domains: Property.Array({
      displayName: 'Domains',
      description: 'A new list of domains to associate with the account.',
      required: false,
    }),
    custom_fields: Property.Json({
      displayName: 'Custom Fields',
      description:
        'IMPORTANT: This will replace all existing custom fields. Provide a complete JSON object of all fields you want to keep.',
      required: false,
    }),
  },
  async run(context) {
    const { account_id, ...body } = context.propsValue;
    const token = context.auth;

    Object.keys(body).forEach(
      (key) =>
        (body as Record<string, unknown>)[key] === undefined &&
        delete (body as Record<string, unknown>)[key]
    );

    return await makeRequest(
      token,
      HttpMethod.PATCH,
      `/accounts/${account_id}`,
      body
    );
  },
});
