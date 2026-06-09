import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { signNowAuth, getSignNowBearerToken } from '../common/auth';

export const customApiCallAction = createCustomApiCallAction({
  auth: signNowAuth,
  name: 'custom_api_call',
  displayName: 'Custom API Call',
  description: 'Make a custom authenticated request to any SignNow API endpoint.',
  baseUrl: () => 'https://api.signnow.com',
  authMapping: async (auth) => ({
    Authorization: `Bearer ${getSignNowBearerToken(auth)}`,
    'Content-Type': 'application/json',
  }),
});
