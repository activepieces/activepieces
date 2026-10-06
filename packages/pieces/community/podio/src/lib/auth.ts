import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PODIO_API_URL, podioApiCall } from './common/client';
import { validateAuthData } from './common/auth';

export const podioAuth = PieceAuth.OAuth2({
      description: "Connect your Podio account to automate workspace management and item operations.",
      authUrl: 'https://podio.com/oauth/authorize',
      tokenUrl: 'https://podio.com/oauth/token',
      required: true,
      scope: ['global:read', 'global:write'],
      getConnectionIdentifier: async ({ auth }) => {
        try {
          const response = await httpClient.sendRequest<PodioUserStatus>({
            method: HttpMethod.GET,
            url: `${PODIO_API_URL}/user/status`,
            headers: { Authorization: `Bearer ${auth.access_token}` },
            timeout: 5000,
          });
          return response.body?.user?.mail || response.body?.profile?.name || undefined;
        } catch {
          return undefined;
        }
      },
      validate: async ({ auth }) => {
        try {
          const validation = validateAuthData(auth);
          if (!validation.valid) {
            return { valid: false, error: validation.error || 'Authentication validation failed' };
          }

          const response = await podioApiCall({
            method: HttpMethod.GET,
            accessToken: auth.access_token,
            resourceUri: '/user/status',
          });

          if (response && typeof response === 'object') {
            return { valid: true };
          }

          return { valid: false, error: 'Failed to validate connection with Podio API' };
        } catch (error: any) {
          if (error.response?.status === 401) {
            return { valid: false, error: 'Invalid or expired access token. Please reconnect your Podio account.' };
          }
          
          if (error.response?.status === 403) {
            return { valid: false, error: 'Access denied. Please check your Podio permissions.' };
          }

          return { 
            valid: false, 
            error: `Connection validation failed: ${error.message || 'Unknown error occurred'}` 
          };
        }
      },
    });

type PodioUserStatus = { user?: { mail?: string }; profile?: { name?: string } };
