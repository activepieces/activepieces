import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createAccount = createAction({
  auth: frontAuth,
  name: 'create_account',
  displayName: 'Create Account',
  description: 'Create a new account (e.g., company) in Front.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the account.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A description for the account.',
      required: false,
    }),
    domains: Property.Array({
      displayName: 'Domains',
      description: 'A list of domains associated with the account.',
      required: false,
    }),
    external_id: Property.ShortText({
        displayName: 'External ID',
        description: 'An optional ID for the account from an external system.',
        required: false,
    }),
    custom_fields: Property.Json({
        displayName: 'Custom Fields',
        description: 'Custom fields for this account, as a JSON object.',
        required: false,
        defaultValue: {}
    })
  },
  async run(context) {
    const { ...body } = context.propsValue;
    const token = context.auth;

    return await makeRequest(
        token,
        HttpMethod.POST,
        '/accounts',
        body
    );
  },
});