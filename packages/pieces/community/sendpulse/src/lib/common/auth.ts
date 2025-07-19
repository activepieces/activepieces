import { PieceAuth } from '@activepieces/pieces-framework';
import { sendPulseApiCall } from './client';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { OAuth2GrantType } from '@activepieces/shared';

export const sendPulseAuth = PieceAuth.OAuth2({
  description: 'Authenticate with your SendPulse Client ID and Secret',
  authUrl: '',
  tokenUrl: 'https://api.sendpulse.com/oauth/access_token',
  required: true,
  scope: [],
  grantType: OAuth2GrantType.CLIENT_CREDENTIALS,
});

export const sendPulseCustomAuth = PieceAuth.CustomAuth({
  description: 'Enter your SendPulse client credentials',
  props: {
    clientId: PieceAuth.SecretText({
      displayName: 'Client ID',
      required: true,
    }),
    clientSecret: PieceAuth.SecretText({
      displayName: 'Client Secret',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const tokenResp = await httpClient.sendRequest<{ access_token: string }>({
        method: HttpMethod.POST,
        url: 'https://api.sendpulse.com/oauth/access_token',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=client_credentials&client_id=${encodeURIComponent(auth.clientId)}&client_secret=${encodeURIComponent(auth.clientSecret)}`,
      });
      const access_token = tokenResp.body.access_token;
      if (!access_token) throw new Error('No access token received');
      await sendPulseApiCall({
        method: HttpMethod.GET,
        resourceUri: '/addressbooks',
        auth: { access_token },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid Client ID or Client Secret',
      };
    }
  },
  required: true,
}); 