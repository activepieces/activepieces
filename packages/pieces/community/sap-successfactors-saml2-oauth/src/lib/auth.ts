import {
  HttpMessageBody,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { successFactorsHttp } from './common/http';
import {
  SuccessFactorsAuthProps,
  SuccessFactorsTokenResponse,
} from './common/types';

const SAML_BEARER_GRANT = 'urn:ietf:params:oauth:grant-type:saml2-bearer';

function parseTokenResponse(body: unknown): SuccessFactorsTokenResponse {
  if (
    typeof body !== 'object' ||
    body === null ||
    Array.isArray(body) ||
    !('access_token' in body) ||
    !('expires_in' in body)
  ) {
    throw new Error('SuccessFactors returned an invalid token response.');
  }

  const accessToken = body.access_token;
  const expiresIn = body.expires_in;
  const tokenType = 'token_type' in body ? body.token_type : undefined;

  if (typeof accessToken !== 'string' || accessToken.trim() === '') {
    throw new Error('SuccessFactors token response did not contain access_token.');
  }

  if (
    (typeof expiresIn !== 'number' && typeof expiresIn !== 'string') ||
    !Number.isFinite(Number(expiresIn)) ||
    Number(expiresIn) <= 0
  ) {
    throw new Error('SuccessFactors token response contained an invalid expires_in.');
  }

  return {
    access_token: accessToken,
    expires_in: expiresIn,
    token_type: typeof tokenType === 'string' ? tokenType : undefined,
  };
}

function normalizePrivateKey(value: string): string {
  const privateKey = successFactorsHttp
    .requireNonEmpty({ value, fieldName: 'Private Key' })
    .replace(/\\n/g, '\n');

  if (
    !privateKey.includes('-----BEGIN') ||
    !privateKey.includes('PRIVATE KEY-----')
  ) {
    throw new Error('Private Key must be a PEM-formatted private key.');
  }

  return privateKey;
}

export async function generateSuccessFactorsToken(
  auth: SuccessFactorsAuthProps,
): Promise<{ access_token: string; expires_in: number }> {
  const authBaseUrl = successFactorsHttp.normalizeBaseUrl({
    value: auth.base_url,
    fieldName: 'Authentication Base URL',
  });
  const tokenUrl = `${authBaseUrl}/oauth/token`;
  const clientId = successFactorsHttp.requireNonEmpty({
    value: auth.client_id,
    fieldName: 'Client ID / API Key',
  });
  const userId = successFactorsHttp.requireNonEmpty({
    value: auth.user_id,
    fieldName: 'User ID',
  });
  const companyId = successFactorsHttp.requireNonEmpty({
    value: auth.company_id,
    fieldName: 'Company ID',
  });
  const privateKey = normalizePrivateKey(auth.private_key);

  const assertionResponse = await httpClient.sendRequest<string>({
    method: HttpMethod.POST,
    url: `${authBaseUrl}/oauth/idp`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'text/plain',
    },
    body: successFactorsHttp.formUrlEncode({
      client_id: clientId,
      user_id: userId,
      grant_type: SAML_BEARER_GRANT,
      private_key: privateKey,
      token_url: tokenUrl,
    }),
  });

  if (typeof assertionResponse.body !== 'string') {
    throw new Error('SuccessFactors returned an invalid SAML assertion response.');
  }

  const assertion = assertionResponse.body.trim();

  if (!assertion) {
    throw new Error('SuccessFactors returned an empty SAML assertion.');
  }

  const tokenResponse = await httpClient.sendRequest<HttpMessageBody>({
    method: HttpMethod.POST,
    url: tokenUrl,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: successFactorsHttp.formUrlEncode({
      company_id: companyId,
      client_id: clientId,
      grant_type: SAML_BEARER_GRANT,
      assertion,
    }),
  });

  const token = parseTokenResponse(tokenResponse.body);

  return {
    access_token: token.access_token,
    expires_in: Number(token.expires_in),
  };
}

export const successFactorsAuth = PieceAuth.CustomAuth({
  displayName: 'SAP SuccessFactors SAML2 OAuth',
  description: `Connect using the OAuth 2.0 SAML 2.0 Bearer Assertion grant. This piece does not support password, Basic Auth, OIDC, or other SuccessFactors authentication methods.

**Setup:**
1. In SuccessFactors, register an OAuth2 client application and copy its API key.
2. Use the API user and company ID associated with that OAuth client.
3. Paste the private key that matches the X.509 certificate registered for the OAuth client.
4. Enter your tenant's authentication server origin and OData API server origin. Enter only each server origin; do not include \`/oauth/token\` or \`/odata/v2\`.

**Security notice:** this compatibility implementation uses SAP SuccessFactors \`/oauth/idp\` to generate the SAML assertion. SAP has deprecated this endpoint because it sends the private key in an API request and plans to delete it on May 14, 2027.`,
  props: {
    base_url: Property.ShortText({
      displayName: 'Authentication Base URL',
      description:
        'HTTPS origin that hosts /oauth/idp and /oauth/token for your SuccessFactors tenant. Enter the origin only, without a path.',
      required: true,
    }),
    api_url: Property.ShortText({
      displayName: 'OData API Base URL',
      description:
        'HTTPS origin of your SuccessFactors OData API server. Enter the origin only; /odata/v2 is added automatically.',
      required: true,
    }),
    client_id: Property.ShortText({
      displayName: 'Client ID / API Key',
      description:
        'API key generated in SuccessFactors when you register the OAuth2 client application.',
      required: true,
    }),
    user_id: Property.ShortText({
      displayName: 'User ID',
      description:
        'SuccessFactors API user represented by the SAML assertion.',
      required: true,
    }),
    company_id: Property.ShortText({
      displayName: 'Company ID',
      description: 'Company ID of the SuccessFactors tenant.',
      required: true,
    }),
    private_key: PieceAuth.SecretText({
      displayName: 'Private Key',
      description:
        'PEM-formatted private key matching the X.509 certificate registered for the OAuth2 client. Keep this value secret.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const token = await generateSuccessFactorsToken(auth);
      await successFactorsHttp.apiCall({
        apiUrl: auth.api_url,
        accessToken: token.access_token,
        method: HttpMethod.GET,
        path: '/odata/v2/User',
        queryParams: {
          '$top': '1',
          '$select': 'userId',
          '$format': 'JSON',
        },
      });

      return { valid: true };
    } catch {
      return {
        valid: false,
        error:
          'Unable to connect to SAP SuccessFactors. Verify both URLs, the OAuth client/API key, user ID, company ID, and private key.',
      };
    }
  },
  refresh: {
    generate: async ({ auth }) => generateSuccessFactorsToken(auth),
  },
  getConnectionIdentifier: async ({ auth }) => {
    const companyId = auth.company_id.trim();
    const userId = auth.user_id.trim();

    if (!companyId || !userId) {
      return undefined;
    }

    return `${companyId} / ${userId}`;
  },
  required: true,
});
