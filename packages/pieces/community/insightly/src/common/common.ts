import { createPiece, PieceAuth, createAction, createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const insightlyAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    apiKey: Property.ShortText({
      displayName: 'API Key',
      description: 'Your Insightly API Key',
      required: true,
    }),
    apiUrl: Property.ShortText({
      displayName: 'API URL',
      description: 'Your Insightly API URL (e.g., https://api.na1.insightly.com/v3.1)',
      required: true,
      defaultValue: 'https://api.na1.insightly.com/v3.1',
    }),
  },
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
  'Emails',
];

export async function makeInsightlyRequest(
  auth: any,
  endpoint: string,
  method: HttpMethod = HttpMethod.GET,
  body?: any
) {
  const apiKey = auth.apiKey;
  const apiUrl = auth.apiUrl.replace(/\/$/, '');
  
  return await httpClient.sendRequest({
    method,
    url: `${apiUrl}${endpoint}`,
    authentication: {
      type: AuthenticationType.BASIC,
      username: apiKey,
      password: '',
    },
    body,
  });
}