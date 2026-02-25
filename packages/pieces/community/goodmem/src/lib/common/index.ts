import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { goodmemAuth } from '../../index';

export interface GoodMemAuthConfig {
  baseUrl: string;
  apiKey: string;
}

export function extractAuthFromContext(auth: AppConnectionValueForAuthProperty<typeof goodmemAuth>): GoodMemAuthConfig {
  if (typeof auth === 'string') {
    throw new Error('Invalid auth format');
  }
  
  const actualAuth = auth.props;
  
  if (!actualAuth || !actualAuth.baseUrl || !actualAuth.apiKey) {
    throw new Error('Invalid authentication: Base URL and API Key are required');
  }
  
  return {
    baseUrl: actualAuth.baseUrl,
    apiKey: actualAuth.apiKey,
  };
}

export function getBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '');
}

export function getCommonHeaders(apiKey: string): Record<string, string> {
  return {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}
