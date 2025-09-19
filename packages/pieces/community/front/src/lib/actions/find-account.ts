import { createAction } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { frontProps } from '../common/props';

export const findAccount = createAction({
  auth: frontAuth,
  name: 'find_account',
  displayName: 'Find Account',
  description:
    'Search for an existing account by its ID, domain, or external ID.',
  props: {
    account_id: frontProps.account(), 
  },
  async run(context) {
    const { account_id } = context.propsValue;
    const token = context.auth;
    return await makeRequest(token, HttpMethod.GET, `/accounts/${account_id}`);
  },
});
