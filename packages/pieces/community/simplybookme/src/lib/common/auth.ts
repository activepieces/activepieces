import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const simplybookAuth = PieceAuth.CustomAuth({
  description:
    'Enter your Simplybook admin credentials to access the Admin API.',
  props: {
    companyLogin: Property.ShortText({
      displayName: 'Company Login',
      description:
        'Your Simplybook company login (e.g., "yourcompany" from yourcompany.simplybook.me)',
      required: true
    }),
    userLogin: Property.ShortText({
      displayName: 'User Login',
      description: 'Your admin user login associated with the company',
      required: true
    }),
    userPassword: Property.ShortText({
      displayName: 'User Password',
      description: 'Your admin user password',
      required: true
    })
  },
  required: true
});

export type SimplybookAuth = {
  companyLogin: string;
  userLogin: string;
  userPassword: string;
};

interface JsonRpcResponse<T = any> {
  jsonrpc: string;
  result?: T;
  error?: { code: number; message: string; data?: any };
  id: number;
}

/**
 * Get access token for Simplybook Admin API
 *
 * Uses getUserToken method with user credentials for Admin API authentication.
 * Headers: X-Company-Login, X-User-Token
 *
 * @param auth - SimplybookAuth object with user credentials
 * @returns The user token to be used in X-User-Token header
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
        method: 'getUserToken',
        params: [auth.companyLogin, auth.userLogin, auth.userPassword],
        id: 1
      },
      timeout: 15000
    });

    if (response.body?.error) {
      const errorCode = response.body.error.code;
      const errorMessage = response.body.error.message;

      // Provide helpful error messages based on error codes
      let helpfulMessage = errorMessage;
      if (errorCode === -33001) helpfulMessage = 'Company does not exist';
      else if (errorCode === -33002) helpfulMessage = 'Wrong API key';
      else if (errorCode === -33003)
        helpfulMessage = 'User with this login and password not found';
      else if (errorCode === -33004) helpfulMessage = 'User is blocked';
      else if (errorCode === -33005)
        helpfulMessage =
          'You are not allowed to use this application when HIPAA Custom Feature is enabled';

      throw new Error(
        `Simplybook authentication error: ${helpfulMessage} (code: ${errorCode})`
      );
    }

    if (response.body?.result) {
      return response.body.result;
    }

    throw new Error('Failed to get access token: No result in response');
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        `Failed to authenticate with Simplybook: ${
          error.response.status
        } - ${JSON.stringify(error.response.body)}`
      );
    }
    throw error;
  }
}

/**
 * Make a JSON-RPC call to Simplybook Admin API
 *
 * Uses the Admin API endpoint (https://user-api.simplybook.me/admin) with X-User-Token header.
 * For public/client API methods, set usePublicEndpoint to true.
 *
 * @param auth - SimplybookAuth object
 * @param method - The JSON-RPC method name to call
 * @param params - Array of parameters for the method
 * @param usePublicEndpoint - Use public endpoint instead of admin (default: false)
 * @returns The result from the JSON-RPC call
 */
export async function makeJsonRpcCall<T = any>(
  auth: SimplybookAuth,
  method: string,
  params: any[] = [],
  usePublicEndpoint = false
): Promise<T> {
  const token = await getAccessToken(auth);

  // Use admin endpoint by default, public endpoint if specified
  const baseUrl = 'https://user-api.simplybook.me';
  const url = usePublicEndpoint ? baseUrl : `${baseUrl}/admin`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Company-Login': auth.companyLogin,
    'X-User-Token': token
  };

  try {
    const response = await httpClient.sendRequest<JsonRpcResponse<T>>({
      method: HttpMethod.POST,
      url: url,
      headers: headers,
      body: {
        jsonrpc: '2.0',
        method: method,
        params: params,
        id: 1
      },
      timeout: 20000
    });

    if (response.body?.error) {
      throw new Error(
        `Simplybook API error: ${response.body.error.message} (code: ${
          response.body.error.code
        })${
          response.body.error.data
            ? ` - ${JSON.stringify(response.body.error.data)}`
            : ''
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
        `Simplybook API request failed: ${
          error.response.status
        } - ${JSON.stringify(error.response.body)}`
      );
    }
    throw error;
  }
}
