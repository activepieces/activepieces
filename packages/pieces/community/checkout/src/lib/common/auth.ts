import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';


export function getEnvironmentFromApiKey(apiKey: string): { environment: 'sandbox' | 'production', baseUrl: string } {
  if (apiKey.startsWith('sk_sbox_')) {
    return { environment: 'sandbox', baseUrl: 'https://api.sandbox.checkout.com' };
  }
  
  if (apiKey.startsWith('sk_') && !apiKey.startsWith('sk_sbox_')) {
    return { environment: 'production', baseUrl: 'https://api.checkout.com' };
  }
  
  return { environment: 'production', baseUrl: 'https://api.checkout.com' };
}

export const checkoutComAuth = PieceAuth.SecretText({
  displayName: 'Secret Key',
  description: 'Your Checkout.com secret key. Use sandbox key (sk_sbox_...) for testing or production key (sk_...) for live transactions. You can find it in the Checkout.com dashboard under Developers > API keys.',
  required: true,
  validate: async (auth) => {
    try {
      const secretKey = auth.auth;
      if (!secretKey.startsWith('sk_')) {
        return { valid: false, error: 'Invalid API key format. Must start with "sk_" for production or "sk_sbox_" for sandbox.' };
      }

      const { environment, baseUrl } = getEnvironmentFromApiKey(secretKey);
      
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/workflows`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: secretKey,
        },
      });
      
      return { 
        valid: true, 
        environment: environment 
      };
    } catch (e: any) {
      if (e.response?.status === 401) {
        return { valid: false, error: 'Invalid Checkout.com secret key. Please check your API key in the Checkout.com dashboard.' };
      } else if (e.response?.status === 403) {
        return { valid: false, error: 'Insufficient permissions. Please ensure your API key has the required permissions.' };
      } else {
        return { valid: false, error: 'Unable to validate API key. Please check your connection and try again.' };
      }
    }
  },
}); 