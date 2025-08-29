import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { assembledAuth } from '../common/auth';

export const customApiCall = createCustomApiCallAction({
  auth: assembledAuth,
  name: 'custom_api_call',
  displayName: 'Custom API Call',
  description: 'Make custom API calls to Assembled endpoints',
  baseUrl: () => 'https://api.assembled.com/v1',
  authMapping: async (auth) => ({
    'Authorization': `Bearer ${auth}`,
    'Content-Type': 'application/json',
  }),
});