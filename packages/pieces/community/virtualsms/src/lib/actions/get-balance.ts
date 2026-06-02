import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { request, virtualSmsAuth } from '../common';

export const getBalance = createAction({
  auth: virtualSmsAuth,
  name: 'get_balance',
  displayName: 'Get Balance',
  description: 'Get current VirtualSMS account balance',
  props: {},
  async run({ auth }) {
    return request(auth, HttpMethod.GET, '/api/v1/customer/balance');
  },
});
