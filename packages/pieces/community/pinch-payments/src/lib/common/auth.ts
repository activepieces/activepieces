import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';

export interface PinchPaymentsAuthCredentials {
  username: string;
  password: string;
  environment: string;
}

export interface PinchPaymentsTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export async function getPinchPaymentsToken(
  credentials: PinchPaymentsAuthCredentials
): Promise<PinchPaymentsTokenResponse> {

  const response = await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: 'https://auth.getpinch.com.au/connect/token',
    authentication: {
      type: AuthenticationType.BASIC,
      username: credentials.username,
      password: credentials.password,
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'api1',
    }),
  });

  return response.body;
}

export const pinchPaymentsAuth = PieceAuth.CustomAuth({
  description: `Connect your Pinch Payments account

This connector requires Pinch Payments API credentials. (Application ID and Secret Key)

How to generate API keys:
1. Sign in to your Pinch Payments account at https://web.getpinch.com.au
2. Navigate to API Keys: https://web.getpinch.com.au/api-keys
3. Create an Application to generate API credentials
4. Copy your Application ID and Secret Key (either live or test depending on the environment)

Authentication uses Basic Auth where:
- Username: Your Application ID
- Password: Your Secret Key
`,
  props: {
    username: Property.ShortText({
      displayName: 'Application ID',
      description: 'Your Application ID',
      required: true,
    }),
    password: Property.ShortText({
      displayName: 'Secret Key',
      description: 'Your Secret Key',
      required: true,
    }),
    environment: Property.StaticDropdown({
      displayName: 'Environment',
      description: 'Pinch API environment to use.',
      required: true,
      options: {
        options: [
          {
            label: 'Live',
            value: 'live',
          },
          {
            label: 'Test',
            value: 'test',
          },
        ],
      },
    })
  },
  required: true,
  async validate(context) {
    try {
      await getPinchPaymentsToken({
        username: context.auth.username,
        password: context.auth.password,
        environment: context.auth.environment
      });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Authentication failed. Please check your credentials.',
      };
    }
  },
});
