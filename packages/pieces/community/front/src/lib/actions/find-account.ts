import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findAccount = createAction({
  auth: frontAuth,
  name: 'find_account',
  displayName: 'Find Account',
  description:
    'Search for an existing account by its ID, domain, or external ID.',
  props: {
    account_id: Property.ShortText({
      displayName: 'Account ID, Domain, or External ID',
      description:
        'The unique identifier of the account to find. Can be the account ID (acc_...), a domain, or an external_id.',
      required: true,
    }),
  },
  async run(context) {
    const { account_id } = context.propsValue;
    const token = context.auth;

    return await makeRequest(token, HttpMethod.GET, `/accounts/${account_id}`);
  },
});
