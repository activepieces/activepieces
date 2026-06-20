import { Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
  HttpMessageBody,
} from '@activepieces/pieces-common';
import { CalendlyEventTypeList } from './types';

interface CalendlyUser {
  /** User uri */
  uri: string;
  email: string;
  name: string;
  /** Organization uri */
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
  getToken(auth: unknown): string {
    if (typeof auth === 'string') {
      return auth;
    }

    if (
      auth &&
      typeof auth === 'object' &&
      'secret_text' in auth &&
      typeof (auth as { secret_text: unknown }).secret_text === 'string'
    ) {
      return (auth as { secret_text: string }).secret_text;
    }

    throw new Error('Invalid Calendly personal token');
  },
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
  resolveUuid(value: unknown): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error('UUID or URI is required');
    }

    const trimmed = value.trim();
    if (trimmed.startsWith('http')) {
      const uuid = calendlyCommon.UuidFromUri(trimmed);
      if (!uuid) {
        throw new Error(`Could not extract UUID from URI: ${trimmed}`);
      }
      return uuid;
    }

    return trimmed;
  },
  apiRequest: async <T extends HttpMessageBody>({
    token,
    method,
    path,
    queryParams,
    body,
  }: {
    token: string;
    method: HttpMethod;
    path: string;
    queryParams?: Record<string, string>;
    body?: Record<string, unknown>;
  }): Promise<T> => {
    const request: HttpRequest = {
      method,
      url: `${calendlyCommon.baseUrl}${path}`,
      headers: {
        Authorization: calendlyCommon.authorizationHeader(token),
      },
      queryParams,
      body,
    };

    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  },
  fetchEventTypes: async (token: string) => {
    const user = await calendlyCommon.getUser(token);
    const response = await calendlyCommon.apiRequest<CalendlyEventTypeList>({
      token,
      method: HttpMethod.GET,
      path: '/event_types',
      queryParams: {
        user: user.uri,
        active: 'true',
        count: '100',
      },
    });
    return response.collection ?? [];
  },
  eventTypeDropdown: () => {
    return Property.Dropdown<string>({
      displayName: 'Event Type',
      refreshers: [],
      required: true,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Calendly account first',
            options: [],
          };
        }

        try {
          const token = calendlyCommon.getToken(auth);
          const eventTypes = await calendlyCommon.fetchEventTypes(token);
          return {
            disabled: false,
            options: eventTypes.map((eventType) => ({
              label: `${eventType.name} (${eventType.duration} min)`,
              value: eventType.uri,
            })),
          };
        } catch {
          return {
            disabled: true,
            placeholder: 'Could not load event types',
            options: [],
          };
        }
      },
    });
  },
  resolveEventTypeUri(value: unknown): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error('Event type URI is required');
    }

    const trimmed = value.trim();
    if (trimmed.startsWith('http')) {
      return trimmed;
    }

    return `${calendlyCommon.baseUrl}/event_types/${trimmed}`;
  },
  listScopeDropdown: () => {
    return Property.StaticDropdown({
      displayName: 'List Scope',
      required: false,
      defaultValue: 'user',
      options: {
        disabled: false,
        options: [
          { label: 'Current user', value: 'user' },
          { label: 'Organization', value: 'organization' },
        ],
      },
    });
  },
};
