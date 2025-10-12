import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const servicenowAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    instanceUrl: Property.ShortText({
      displayName: 'Instance URL',
      description: 'Your ServiceNow instance URL without trailing slash (e.g., https://dev12345.service-now.com)',
      required: true,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'Your ServiceNow username (not email)',
      required: true,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'Your ServiceNow password (not API token)',
      required: true,
    }),
  },
});

export async function makeServiceNowRequest(
  auth: any,
  endpoint: string,
  method: HttpMethod = HttpMethod.GET,
  body?: any,
  isFormData: boolean = false
) {
  const instanceUrl = auth.instanceUrl;
  const username = auth.username;
  const password = auth.password;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');

  return await httpClient.sendRequest({
    method,
    url: `${instanceUrl}/api/now${endpoint}`,
    headers: {
      ...headers,
      'Authorization': `Basic ${credentials}`,
    },
    body,
  });
}