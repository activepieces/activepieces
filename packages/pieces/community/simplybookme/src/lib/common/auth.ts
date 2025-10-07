import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const simplybookAuth = PieceAuth.CustomAuth({
  description: 'Enter your Simplybook API credentials. You can find your API key in the admin interface under Plugins > API > Settings.',
  props: {
    companyLogin: Property.ShortText({
      displayName: 'Company Login',
      description: 'Your Simplybook company login (e.g., "yourcompany" from yourcompany.simplybook.me)',
      required: true
    }),
    apiKey: Property.ShortText({
      displayName: 'API Key',
      description: 'Your Simplybook API key (found in admin interface: Plugins > API > Settings)',
      required: true
    })
  },
  required: true
});

export type SimplybookAuth = {
  apiKey: string;
  companyLogin: string;
};

interface JsonRpcResponse<T = any> {
  jsonrpc: string;
  result?: T;
  error?: { code: number; message: string; data?: any };
  id: number;
}

/**
 * Get access token for Simplybook API
 * 
 * Simplybook API methods require authentication via access-token.
 * To authorize in Simplybook API you need to get an access key (access-token).
 * This token is obtained by calling the JSON-RPC method getToken on 
 * http://user-api.simplybook.me/login service passing your personal API-key.
 * 
 * Once you have the token, your requests should contain the following headers:
 * - X-Company-Login: Your company login
 * - X-Token: The access token obtained from this function
 * 
 * @param auth - SimplybookAuth object containing apiKey and companyLogin
 * @returns The access token to be used in X-Token header
 */
export async function getAccessToken(auth: SimplybookAuth): Promise<string> {
  try {
    const response = await httpClient.sendRequest<JsonRpcResponse<string>>({
      method: HttpMethod.POST,
      url: 'https://user-api.simplybook.me/login',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        jsonrpc: '2.0',
        method: 'getToken',
        params: [auth.companyLogin, auth.apiKey],
        id: 1
      }
    });

    if (response.body?.error) {
      throw new Error(
        `Simplybook API error: ${response.body.error.message} (code: ${response.body.error.code})`
      );
    }

    if (response.body?.result) {
      return response.body.result;
    }

    throw new Error('Failed to get access token: No result in response');
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        `Failed to authenticate with Simplybook: ${error.response.status} - ${JSON.stringify(error.response.body)}`
      );
    }
    throw new Error(`Failed to authenticate with Simplybook: ${error.message}`);
  }
}

/**
 * Make a JSON-RPC call to Simplybook API
 * 
 * @param auth - SimplybookAuth object
 * @param method - The JSON-RPC method name to call
 * @param params - Array of parameters for the method
 * @returns The result from the JSON-RPC call
 */
export async function makeJsonRpcCall<T = any>(
  auth: SimplybookAuth,
  method: string,
  params: any[] = []
): Promise<T> {
  const accessToken = await getAccessToken(auth);

  try {
    const response = await httpClient.sendRequest<JsonRpcResponse<T>>({
      method: HttpMethod.POST,
      url: 'https://user-api.simplybook.me',
      headers: {
        'Content-Type': 'application/json',
        'X-Company-Login': auth.companyLogin,
        'X-Token': accessToken
      },
      body: {
        jsonrpc: '2.0',
        method: method,
        params: params,
        id: 1
      }
    });

    if (response.body?.error) {
      throw new Error(
        `Simplybook API error: ${response.body.error.message} (code: ${response.body.error.code})${
          response.body.error.data ? ` - ${JSON.stringify(response.body.error.data)}` : ''
        }`
      );
    }

    if (response.body?.result !== undefined) {
      return response.body.result;
    }

    throw new Error('Failed to get result from Simplybook API');
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        `Simplybook API request failed: ${error.response.status} - ${JSON.stringify(error.response.body)}`
      );
    }
    throw error;
  }
}
