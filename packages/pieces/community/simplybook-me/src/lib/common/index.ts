import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';

export const API_BASE_URL = 'https://user-api.simplybook.me';

export interface SimplyBookAuth {
  companyLogin: string;
  apiKey: string;
  accessToken?: string;
  tokenExpiry?: number;
}

export const simplyBookAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    companyLogin: Property.ShortText({
      displayName: 'Company Login',
      description: 'Your SimplyBook.me company login',
      required: true,
    }),
    apiKey: Property.ShortText({
      displayName: 'API Key',
      description: 'Your SimplyBook.me API key (found in Custom Features > API)',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const token = await getAccessToken(auth.companyLogin, auth.apiKey);
      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid credentials. Please check your company login and API key.',
      };
    }
  },
});

export async function getAccessToken(companyLogin: string, apiKey: string): Promise<string> {
  const response = await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: `${API_BASE_URL}/login`,
    headers: {
      'X-Company-Login': companyLogin,
      'Content-Type': 'application/json',
    },
    body: {
      jsonrpc: '2.0',
      method: 'getToken',
      params: {
        apiKey: apiKey,
      },
      id: 1,
    },
  });

  if (response.body && response.body.result) {
    return response.body.result;
  }
  
  throw new Error('Failed to get access token');
}

export async function makeApiRequest(
  auth: SimplyBookAuth,
  method: string,
  params: Record<string, any> = {}
): Promise<any> {
  let accessToken = auth.accessToken;
  
  // Check if token is expired or doesn't exist
  if (!accessToken || !auth.tokenExpiry || Date.now() >= auth.tokenExpiry) {
    accessToken = await getAccessToken(auth.companyLogin, auth.apiKey);
    auth.accessToken = accessToken;
    auth.tokenExpiry = Date.now() + 50 * 60 * 1000; // 50 minutes (token expires in 1 hour)
  }

  const response = await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: `${API_BASE_URL}/admin/`,
    headers: {
      'X-Company-Login': auth.companyLogin,
      'X-Token': accessToken,
      'Content-Type': 'application/json',
    },
    body: {
      jsonrpc: '2.0',
      method: method,
      params: params,
      id: Math.floor(Math.random() * 1000000),
    },
  });

  if (response.body && response.body.error) {
    throw new Error(`API Error: ${response.body.error.message || 'Unknown error'}`);
  }

  return response.body.result;
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatDateTime(date: Date): string {
  return date.toISOString();
}

// Export types
export * from './types';
