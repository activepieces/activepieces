import { OAuth2PropertyValue, PieceAuth } from '@activepieces/pieces-framework';
import { podioApi } from './common/api';

export const podioAuth = PieceAuth.OAuth2({
      description: "Connect your Podio account to automate workspace management and item operations.",
      authUrl: 'https://podio.com/oauth/authorize',
      tokenUrl: 'https://podio.com/oauth/token',
      required: true,
      scope: ['global:read', 'global:write', 'global:delete'],
      getConnectionIdentifier: async ({ auth }) => {
        try {
          const status = await podioApi.getUserStatus({ auth, timeout: 5000 });
          return status?.user?.mail || status?.profile?.name || undefined;
        } catch {
          return undefined;
        }
      },
      validate: async ({ auth }) => {
        try {
          const validation = validateAuthData({ auth });
          if (!validation.valid) {
            return { valid: false, error: validation.error || 'Authentication validation failed' };
          }

          const response = await podioApi.getUserStatus({ auth: { access_token: auth.access_token } });

          if (response && typeof response === 'object') {
            return { valid: true };
          }

          return { valid: false, error: 'Failed to validate connection with Podio API' };
        } catch (error) {
          return {
            valid: false,
            error: `Connection validation failed: ${(error instanceof Error && error.message) || 'Unknown error occurred'}`
          };
        }
      },
    });

function isTokenExpired({ auth }: { auth: OAuth2PropertyValue }): boolean {
  if (!auth.data?.['expires_in'] || !auth.data?.['claimed_at']) {
    return false;
  }

  const secondsSinceEpoch = Math.round(Date.now() / 1000);
  const expiresIn = auth.data['expires_in'];
  const claimedAt = auth.data['claimed_at'];
  const refreshThreshold = 15 * 60;

  return secondsSinceEpoch + refreshThreshold >= claimedAt + expiresIn;
}

function validateAuthData({ auth }: { auth: OAuth2PropertyValue }): { valid: boolean; error?: string } {
  if (!auth) {
    return { valid: false, error: 'Authentication data is missing' };
  }

  if (!auth.access_token) {
    return { valid: false, error: 'Access token is missing' };
  }

  if (isTokenExpired({ auth })) {
    return { valid: false, error: 'Access token has expired' };
  }

  return { valid: true };
}
