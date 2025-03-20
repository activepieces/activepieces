import { createAction } from '@activepieces/pieces-framework';
import { textToCadAuth } from '../../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getUserBalanceAction = createAction({
  name: 'get_user_balance',
  displayName: 'Get User Balance',
  description: 'Retrieve the current balance for your user account',
  auth: textToCadAuth,
  category: 'Payments',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.zoo.dev/user/payment/balance',
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });
    return response.body;
  },
});
