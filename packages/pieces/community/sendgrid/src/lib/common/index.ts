import { AppConnectionValueForAuthProperty, PieceAuth, Property } from '@activepieces/pieces-framework';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

export const sendgridCommon = {
  baseUrl: (residency = 'US'): string => {
    const urls: { [key: string]: string } = {
      US: 'https://api.sendgrid.com/v3',
      EU: 'https://api.eu.sendgrid.com/v3',
    };
    return urls[residency] || urls['US'];
  },
};

export function getApiKey(auth: SendgridAuthValue): string {
  if (auth.type === AppConnectionType.SECRET_TEXT) {
    return auth.secret_text;
  }
  return auth.props['apiKey'] as string;
}

export function getBaseUrl(auth: SendgridAuthValue): string {
  if (auth.type === AppConnectionType.SECRET_TEXT) {
    return sendgridCommon.baseUrl('US');
  }
  return sendgridCommon.baseUrl(auth.props['dataResidency'] as string);
}

export async function fetchAllLists(auth: SendgridAuthValue): Promise<SendgridList[]> {
  const lists: SendgridList[] = [];
  let url: string | undefined = `${getBaseUrl(auth)}/marketing/lists?page_size=1000`;
  while (url) {
    const response = await httpClient.sendRequest<{
      result: SendgridList[];
      _metadata: { next?: string };
    }>({
      method: HttpMethod.GET,
      url,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: getApiKey(auth),
      },
    }) as any;
    lists.push(...(response.body.result ?? []));
    url = response.body._metadata?.next;
  }
  return lists;
}

export const sendgridAuth = [
  PieceAuth.SecretText({
    displayName: 'API Key',
    description: 'API key acquired from your SendGrid settings',
    required: true,
  }),
  PieceAuth.CustomAuth({
    displayName: 'API Key + Data Residency',
    description: 'Authenticate with API key and select data residency region',
    required: true,
    props: {
      apiKey: PieceAuth.SecretText({
        displayName: 'API Key',
        description: 'API key acquired from your SendGrid settings',
        required: true,
      }),
      dataResidency: Property.StaticDropdown({
        displayName: 'Data Residency',
        description: 'Select the Data Residency for this API key',
        required: true,
        defaultValue: 'US',
        options: {
          options: [
            { label: 'Global (US)', value: 'US' },
            { label: 'EU', value: 'EU' },
          ],
        },
      }),
    },
  }),
];

export type SendgridAuthValue = AppConnectionValueForAuthProperty<typeof sendgridAuth>;

export type SendgridList = {
  id: string;
  name: string;
  contact_count: number;
};
