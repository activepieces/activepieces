import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient } from '@activepieces/pieces-common';

export const klaviyoAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Your Klaviyo private API key',
}, async (value) => {
  // Validate API key by calling Klaviyo accounts endpoint
  const response = await httpClient.sendRequest({
    method: 'GET',
    url: 'https://a.klaviyo.com/api/accounts',
    headers: {
      'Authorization': `Klaviyo-API-Key ${value}`,
      'Accept': 'application/json'
    }
  });
  if (response.status >= 400) {
    throw new Error('Invalid Klaviyo API key');
  }
  return true;
});