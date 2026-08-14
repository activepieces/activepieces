import jwt from 'jsonwebtoken';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const CLIENT_ASSERTION_LIFETIME_SECONDS = 300;

// NetSuite requires the SuiteTalk REST hostname to be lowercase with underscores
// replaced by hyphens (e.g. account id "1234567_SB1" -> host "1234567-sb1").
// Docs: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_1497440505.html
function toNetSuiteRestHost(accountId: string): string {
  return accountId.toLowerCase().replace(/_/g, '-');
}

function buildClientAssertion({
  clientId,
  certificateId,
  privateKey,
  scope,
  tokenUrl,
}: {
  clientId: string;
  certificateId: string;
  privateKey: string;
  scope: string;
  tokenUrl: string;
}): string {
  const nowSeconds = Math.floor(Date.now() / 1000);

  return jwt.sign(
    {
      iss: clientId,
      scope,
      aud: tokenUrl,
      iat: nowSeconds,
      exp: nowSeconds + CLIENT_ASSERTION_LIFETIME_SECONDS,
    },
    privateKey,
    {
      algorithm: 'PS256',
      keyid: certificateId,
    }
  );
}

interface NetSuiteM2MTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export function getNetSuiteM2MTokenUrl(accountId: string): string {
  return `https://${toNetSuiteRestHost(
    accountId
  )}.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token`;
}

// NetSuite OAuth 2.0 Client Credentials (M2M) grant: builds a certificate-signed
// JWT client assertion and exchanges it for an access token.
// Docs: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_162790605110.html
export async function requestNetSuiteM2MAccessToken({
  accountId,
  clientId,
  certificateId,
  privateKey,
  scope,
}: {
  accountId: string;
  clientId: string;
  certificateId: string;
  privateKey: string;
  scope: string;
}): Promise<NetSuiteM2MTokenResponse> {
  const tokenUrl = getNetSuiteM2MTokenUrl(accountId);

  const clientAssertion = buildClientAssertion({
    clientId,
    certificateId,
    privateKey,
    scope,
    tokenUrl,
  });

  const response = await httpClient.sendRequest<NetSuiteM2MTokenResponse>({
    method: HttpMethod.POST,
    url: tokenUrl,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_assertion_type:
        'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: clientAssertion,
    }),
  });

  return response.body;
}
