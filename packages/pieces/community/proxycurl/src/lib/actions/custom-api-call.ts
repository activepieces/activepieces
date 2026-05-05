import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { proxycurlAuth } from '../../index';
import { BASE_URL } from '../common/client';

export const customApiCallAction = createCustomApiCallAction({
  auth: proxycurlAuth,
  name: 'custom_api_call',
  displayName: 'Custom API Call',
  description: 'Make a custom API call to any Proxycurl endpoint.',
  baseUrl: () => BASE_URL,
  authMapping: async (auth) => ({
    Authorization: `Bearer ${auth.secret_text}`,
    Accept: 'application/json',
  }),
});
