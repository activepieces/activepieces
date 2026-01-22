import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty, PieceAuth } from '@activepieces/pieces-framework';

export const insightlyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Enter your Insightly API key. You can find this in your Insightly account under User Settings > API Keys.',
  required: true,
});

export const INSIGHTLY_OBJECTS = [
  'Contacts',
  'Leads', 
  'Opportunities',
  'Organisations',
  'Projects',
  'Tasks',
  'Events',
  'Notes',
  'Products',
  'Quotations'
];

export async function makeInsightlyRequest(
  auth: AppConnectionValueForAuthProperty<typeof insightlyAuth>, 
  endpoint: string, 
  pod = 'na1',
  method: HttpMethod = HttpMethod.GET,
  body?: any
) {
  const baseUrl = `https://api.${pod}.insightly.com/v3.1`;
  const url = `${baseUrl}${endpoint}`;

  const requestConfig: any = {
    method,
    url,
    authentication: {
      type: AuthenticationType.BASIC,
      username: auth.secret_text,
      password: '',
    },
  };

  if (body && (method === HttpMethod.POST || method === HttpMethod.PUT)) {
    requestConfig.headers = {
      'Content-Type': 'application/json',
    };
    requestConfig.body = body;
  }

  return await httpClient.sendRequest(requestConfig);
}