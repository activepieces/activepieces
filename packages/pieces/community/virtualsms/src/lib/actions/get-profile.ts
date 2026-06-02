import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { request, virtualSmsAuth } from '../common';

export const getProfile = createAction({
  auth: virtualSmsAuth,
  name: 'get_profile',
  displayName: 'Get Profile',
  description:
    'Get your VirtualSMS account profile including total spent, order count, and API key stats.',
  props: {},
  async run({ auth }) {
    return request(auth, HttpMethod.GET, '/api/v1/customer/profile');
  },
});
