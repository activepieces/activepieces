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
    domains: Property.Array({
      displayName: 'Domains',
      description: 'List of domains associated with the account.',
      required: false,
      properties: {
        domain: Property.ShortText({
          displayName: 'Domain',
          description: 'A domain associated with the account.',
          required: true,
        }),
      },
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'An external identifier for the account.',
      required: false,
    }),
    custom_fields: Property.Json({
      displayName: 'Custom Fields',
      description: 'Custom fields for this account, as a JSON object.',
      required: false,
      defaultValue: {}
    })
  },
  async run({ auth, propsValue }) {
    const { name, description, domains, external_id,custom_fields } = propsValue;

    const body: Record<string, unknown> = { name };
    if (description) {
      body['description'] = description;
    }
    if (domains) {
      body['domains'] = domains;
    }
    if (external_id) {
      body['external_id'] = external_id;
    }
    if(custom_fields){
      body['custom_fields']=custom_fields;
    }
    return await makeRequest(auth, HttpMethod.POST, `/accounts`, body);
  },
});
