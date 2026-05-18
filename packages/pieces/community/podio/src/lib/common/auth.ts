import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export function getAccessToken(auth: OAuth2PropertyValue): string {
  return auth.access_token;
}

export function getRefreshToken(auth: OAuth2PropertyValue): string | undefined {
  return auth.data?.['refresh_token'];
}

export function isTokenExpired(auth: OAuth2PropertyValue): boolean {
  if (!auth.data?.['expires_in'] || !auth.data?.['claimed_at']) {
    return false;
  }
  
  const secondsSinceEpoch = Math.round(Date.now() / 1000);
  const expiresIn = auth.data['expires_in'];
  const claimedAt = auth.data['claimed_at'];
  const refreshThreshold = 15 * 60; // 15 minutes buffer
  
  return secondsSinceEpoch + refreshThreshold >= claimedAt + expiresIn;
}

export function validateAuthData(auth: OAuth2PropertyValue): { valid: boolean; error?: string } {
  if (!auth) {
    return { valid: false, error: 'Authentication data is missing' };
  }
  
  if (!auth.access_token) {
    return { valid: false, error: 'Access token is missing' };
  }
  
  if (isTokenExpired(auth)) {
    return { valid: false, error: 'Access token has expired' };
  }
  
  return { valid: true };
}

export function getTokenType(auth: OAuth2PropertyValue): string {
  return auth.data?.['token_type'] || 'Bearer';
}

export function getAuthorizationHeader(auth: OAuth2PropertyValue): string {
  const tokenType = getTokenType(auth);
  const accessToken = getAccessToken(auth);
  return `${tokenType} ${accessToken}`;
} 