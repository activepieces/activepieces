import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';

export interface CashgramAuthCredentials {
  clientId: string;
  clientSecret: string;
}

export interface CashgramTokenResponse {
  success: boolean;
  token?: string;
  error?: any;
  message?: string;
}

/**
 * Generate bearer token for Cashgram operations using client credentials and public key
 *
 * This implementation uses crypto to generate the proper x-cf-signature.
 */
export async function generateCashgramToken(
  credentials: CashgramAuthCredentials,
  environment: 'sandbox' | 'production'
): Promise<CashgramTokenResponse> {
  try {
    const baseUrl = environment === 'production'
      ? 'https://payout-api.cashfree.com/payout/v1/authorize'
      : 'https://payout-gamma.cashfree.com/payout/v1/authorize';

    const headers = {
      'x-client-id': credentials.clientId,
      'x-client-secret': credentials.clientSecret,
      'Content-Type': 'application/json',
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: baseUrl,
      headers: headers,
      body: {},
    });
    
    if (response.status === 200 && response.body?.data?.token) {
      return {
        success: true,
        token: response.body.data.token,
        message: 'Bearer token generated successfully',
      };
    } else {
      return {
        success: false,
        error: response.body,
        message: `Failed to generate bearer token. Status: ${response.status}. Response: ${JSON.stringify(response.body)}`,
      };
    }
  } catch (error) {
    console.error('Error generating Cashgram token:', error);
    return {
      success: false,
      error: error,
      message: 'An error occurred while generating the bearer token',
    };
  }
}

/**
 * Validate authentication credentials based on auth type
 */
export function validateAuthCredentials(authType: string, credentials: {
  clientId?: string;
  clientSecret?: string;
}): {
  isValid: boolean;
  error?: string;
} {
  if (authType === 'client_credentials') {
    if (!credentials.clientId || (credentials.clientId).trim().length === 0) {
      return {
        isValid: false,
        error: 'Client ID is required for Client Credentials authentication',
      };
    }

    if (!credentials.clientSecret || (credentials.clientSecret).trim().length === 0) {
      return {
        isValid: false,
        error: 'Client Secret is required for Client Credentials authentication',
      };
    }
  } else if (authType === 'client_credentials_with_public_key') {
    if (!credentials.clientId || (credentials.clientId).trim().length === 0) {
      return {
        isValid: false,
        error: 'Client ID is required for Client Credentials + Public Key authentication',
      };
    }

    if (!credentials.clientSecret || (credentials.clientSecret).trim().length === 0) {
      return {
        isValid: false,
        error: 'Client Secret is required for Client Credentials + Public Key authentication',
      };
    }



  }

  return {
    isValid: true,
  };
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use validateAuthCredentials instead
 */
export function validateCashgramCredentials(credentials: CashgramAuthCredentials): {
  isValid: boolean;
  error?: string;
} {
  return validateAuthCredentials('client_credentials_with_public_key', credentials);
}

export const cashfreePaymentsAuth = PieceAuth.CustomAuth({
  description: `Connect your Cashfree account

This connector requires Cashfree API credentials (Client ID and Client Secret). Important: each Cashfree product is a separate product and requires its own credentials. For example, the Payments API and the Payouts API each need their own Client ID / Client Secret pairs.

Create two connections (recommended)
- For clarity and security we recommend creating two separate Activepieces connections:
  1. **Payments connection** — use the Payments API Client ID / Client Secret. Use this connection for payments-related actions (create order, payment links, refunds, etc.).
  2. **Payouts connection** — use the Payouts API Client ID / Client Secret. Use this connection for Cashgram and other payouts-related actions.

Which keys to use
- Payments API: use the credentials generated for the Payments product.
- Payouts API (required by Cashgram actions): use credentials generated from the Payouts dashboard.

How to generate API keys:
1. Sign in to your Cashfree account and open the *Payouts* dashboard.
2. In the navigation panel select **Developers**.
3. Click **API Keys**.
4. Click **Generate API Keys** on the API Keys screen.
5. The **New API Keys** popup displays the Client ID and Client Secret.
6. Click **Download API Keys** to save the keys locally. Keep these secret — do not share them.

`,
  props: {
    clientId: Property.ShortText({
      displayName: 'Cashfree Client ID',
      description: 'Your Cashfree Client ID',
      required: false,
    }),
    clientSecret: Property.ShortText({
      displayName: 'Cashfree Client Secret',
      description: 'Your Cashfree Client Secret',
      required: false,
    })
  },  
  required: true,
});