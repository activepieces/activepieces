import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { assembledAuth } from '../common/auth';

export const customApiCall = createCustomApiCallAction({
  auth: assembledAuth,
  name: 'custom_api_call',
  displayName: 'Custom API Call',
  description: 'Make custom API calls to Assembled endpoints',
  baseUrl: () => 'https://api.assembledhq.com/v0',
  authMapping: async (auth) => ({
    'Authorization': `Basic ${Buffer.from(auth + ':').toString('base64')}`,
    'Content-Type': 'application/json',
  }),
});