import { createAction } from '@activepieces/pieces-framework';
import { textToCadAuth } from '../../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const deleteUserPaymentAction = createAction({
  name: 'delete_user_payment',
  displayName: 'Delete User Payment Info',
  description: 'Delete payment information for your user account',
  auth: textToCadAuth,
  category: 'Payments',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: 'https://api.zoo.dev/user/payment',
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });
    return response.body;
  },
});
