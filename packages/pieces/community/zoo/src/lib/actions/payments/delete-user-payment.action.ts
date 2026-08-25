import { createAction } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const deleteUserPaymentAction = createAction({
  name: 'delete_user_payment',
  displayName: 'Delete User Payment Info',
  description: 'Delete payment information for your user account',
  audience: 'both',
  aiMetadata: { description: 'Remove the stored payment information from the authenticated user account. Destructive and not reversible; confirm intent before calling. Applies to the individual user, not the organization.', idempotent: false },
  auth: zooAuth,
  // category: 'Payments',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: 'https://api.zoo.dev/user/payment',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });
    return response.body;
  },
});
