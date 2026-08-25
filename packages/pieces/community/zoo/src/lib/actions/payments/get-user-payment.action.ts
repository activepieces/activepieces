import { createAction } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getUserPaymentAction = createAction({
  name: 'get_user_payment',
  displayName: 'Get User Payment Info',
  description: 'Retrieve payment information for your user account',
  audience: 'both',
  aiMetadata: { description: 'Read the stored billing/payment information for the authenticated user account. Use this for the single current record; to enumerate all saved cards use List User Payment Methods. Read-only and safe to repeat.', idempotent: true },
  auth: zooAuth,
  // category: 'Payments',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.zoo.dev/user/payment',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });
    return response.body;
  },
});
