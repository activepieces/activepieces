import { Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

interface CalendlyUser {
  /**User uri */
  uri: string;
  email: string;
  name: string;
  /**Organization uri */
  current_organization: string;
}
export interface CalendlyWebhookInformation {
  webhookId: string;
}

export const calendlyCommon = {
  baseUrl: 'https://api.calendly.com',
  scope: Property.StaticDropdown({
    displayName: 'Scope',
    required: true,
    options: {
      options: [
        { value: 'user', label: 'User' },
        { value: 'organization', label: 'Organization' },
      ],
      disabled: false,
    },
  }),
  getUser: async (personalToken: string) => {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${calendlyCommon.baseUrl}/users/me`,
      headers: {
        Authorization: calendlyCommon.authorizationHeader(personalToken),
      },
    };
    const response = await httpClient.sendRequest<{ resource: CalendlyUser }>(
      request
    );
    return response.body.resource;
  },
  authorizationHeader: (personalToken: string) => `Bearer ${personalToken}`,
  UuidFromUri: (uri: string) => uri.split('/').pop(),
};
