import { createAction } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getUserBalanceAction = createAction({
  name: 'get_user_balance',
  displayName: 'Get User Balance',
  description: 'Retrieve the current balance for your user account',
  audience: 'both',
  aiMetadata: { description: 'Read the current account balance for the authenticated user. Use for the individual user; the org-level equivalent is the get organization balance action. Read-only and idempotent; takes no inputs.', idempotent: true },
  auth: zooAuth,
  // category: 'Payments',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.zoo.dev/user/payment/balance',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });
    return response.body;
  },
});
