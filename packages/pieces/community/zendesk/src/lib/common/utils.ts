import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { ZendeskAuthProps } from './types';

export function getZendeskHeaders(auth: ZendeskAuthProps) {
  const { email, token } = auth;
  return {
    Authorization: `Basic ${Buffer.from(`${email}/token:${token}`).toString('base64')}`,
    'Content-Type': 'application/json',
  };
}

export function getZendeskBaseUrl(subdomain: string) {
  return `https://${subdomain}.zendesk.com/api/v2`;
}

export async function makeZendeskRequest<T = any>(
  auth: ZendeskAuthProps,
  endpoint: string,
  method: HttpMethod = HttpMethod.GET,
  body?: any
): Promise<T> {
  const baseUrl = getZendeskBaseUrl(auth.subdomain);
  const response = await httpClient.sendRequest<T>({
    url: `${baseUrl}${endpoint}`,
    method,
    body,
    authentication: {
      type: AuthenticationType.BASIC,
      username: auth.email + '/token',
      password: auth.token,
    },
  });
  
  return response.body;
}

export function validateZendeskAuth(auth: any): auth is ZendeskAuthProps {
  return (
    auth &&
    typeof auth.email === 'string' &&
    typeof auth.token === 'string' &&
    typeof auth.subdomain === 'string'
  );
}

export function createZendeskAuthValidation() {
  return {
    placeholder: 'Fill your authentication first',
    disabled: true,
    options: [],
  };
}

// Common error messages
export const ZENDESK_ERRORS = {
  INVALID_AUTH: 'Invalid Zendesk authentication. Please check your email, token, and subdomain.',
  NOT_FOUND: 'Resource not found in Zendesk.',
  UNAUTHORIZED: 'Unauthorized access to Zendesk API.',
  RATE_LIMITED: 'Rate limited by Zendesk API. Please try again later.',
  SERVER_ERROR: 'Zendesk server error occurred.',
} as const;