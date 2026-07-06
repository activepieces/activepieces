import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { visibleAuth } from '../..';

export const customApiCall = createCustomApiCallAction({
  auth: visibleAuth,
  name: 'custom_api_call',
  displayName: 'Custom API Call',
  description: 'Make a custom API call to any Visible endpoint',
  baseUrl: () => 'https://api.visible.vc',
  authMapping: async (auth) => ({
    Authorization: `Bearer ${auth.secret_text}`,
    'Content-Type': 'application/json',
  }),
});
