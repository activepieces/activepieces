import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';


export const oktaAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    domain: Property.ShortText({
      displayName: 'Okta Domain',
      description: 'Your Okta organization domain (e.g., https://dev-12345.okta.com or dev-12345.okta.com)',
      required: true,
    }),
    apiToken: Property.ShortText({
      displayName: 'API Token',
      description: 'Your Okta API token (from Admin → Security → API → Tokens)',
      required: true,
    }),
  },
});

export async function makeOktaRequest(
  auth: any,
  endpoint: string,
  method: HttpMethod = HttpMethod.GET,
  body?: any
) {
  const apiToken = auth.apiToken;
  let domain = auth.domain;
  
  if (!domain) {
    throw new Error('Okta domain is required');
  }
  
  if (!domain.startsWith('https://') && !domain.startsWith('http://')) {
    domain = `https://${domain}`;
  }
  domain = domain.replace(/\/$/, '');

  return await httpClient.sendRequest({
    method,
    url: `${domain}/api/v1${endpoint}`,
    headers: {
      'Authorization': `SSWS ${apiToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body,
  });
}