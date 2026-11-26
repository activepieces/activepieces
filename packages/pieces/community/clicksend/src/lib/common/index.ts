import {
  Property,
  PiecePropValueSchema,
  DropdownOption,
} from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
  httpClient,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { clicksendAuth } from '../..';

export const clicksendCommon = {
  baseUrl: 'https://rest.clicksend.com/v3',

  phone_number: Property.ShortText({
    description: 'International format, with the country code.',
    displayName: 'Phone Number',
    required: true,
    placeholder: '+14155550123',
  }),

  email: Property.ShortText({
    displayName: 'Email Address',
    required: true,
    placeholder: 'jane@example.com',
  }),

  contact_list_id: Property.Dropdown({
    auth: clicksendAuth,
    displayName: 'Contact List',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your ClickSend account first.',
        };
      }

      const authValue = auth;

      const options: DropdownOption<number>[] = [];

      try {
        let currentPage = 1;
        let hasNext = true;

        do {
          const response = await callClickSendApi<{
            data: {
              next_page_url?: string;
              data: { list_id: number; list_name: string }[];
            };
          }>({
            method: HttpMethod.GET,
            username: authValue.username,
            password: authValue.password,
            path: '/lists',
            query: { page: currentPage.toString(), limit: '100' },
          });

          const items = response.body.data?.data ?? [];

          for (const list of items) {
            options.push({ label: list.list_name, value: list.list_id });
          }

          currentPage++;
          hasNext = !!response.body.data?.next_page_url;
        } while (hasNext);
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'Could not load contact lists. Check your connection.',
        };
      }

      if (options.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No contact lists found. Create one first.',
        };
      }

      return {
        disabled: false,
        options,
      };
    },
  }),

  contact_id: Property.Dropdown({
    auth: clicksendAuth,
    displayName: 'Contact',
    required: true,
    refreshers: ['contact_list_id'],
    options: async ({ auth, contact_list_id }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your ClickSend account first.',
        };
      }

      if (!contact_list_id) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Select a contact list first.',
        };
      }

      const authValue = auth;

      const options: DropdownOption<number>[] = [];

      try {
        let currentPage = 1;
        let hasNext = true;

        do {
          const response = await callClickSendApi<{
            data: {
              next_page_url?: string;
              data: {
                contact_id: number;
                email?: string;
                first_name?: string;
                last_name?: string;
                phone_number?: string;
              }[];
            };
          }>({
            method: HttpMethod.GET,
            username: authValue.username,
            password: authValue.password,
            path: `/lists/${contact_list_id}/contacts`,
            query: { page: currentPage.toString(), limit: '100' },
          });

          const items = response.body.data?.data ?? [];

          for (const contact of items) {
            options.push({
              label: buildContactLabel(contact),
              value: contact.contact_id,
            });
          }

          currentPage++;
          hasNext = !!response.body.data?.next_page_url;
        } while (hasNext);
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'Could not load contacts. Check your connection.',
        };
      }

      if (options.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No contacts in this list.',
        };
      }

      return {
        disabled: false,
        options,
      };
    },
  }),
  sender_id: Property.Dropdown({
    auth: clicksendAuth,
    displayName: 'From',
    refreshers: [],
    required: true,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your ClickSend account first.',
        };
      }
      const authValue = auth;

      const response = await callClickSendApi<{
        data: { user_id: number; username: string };
      }>({
        method: HttpMethod.GET,
        path: '/account',
        username: authValue.username,
        password: authValue.password,
      });

      return {
        disabled: false,
        options: [
          {
            label: response.body.data.username,
            value: response.body.data.user_id,
          },
        ],
      };
    },
  }),
};

interface clickSendApiParams {
  method: HttpMethod;
  username: string;
  password: string;
  path: string;
  query?: QueryParams;
  body?: any;
}

export async function callClickSendApi<T extends HttpMessageBody>(
  params: clickSendApiParams
): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method: params.method,
    url: `${clicksendCommon.baseUrl}${params.path}`,
    authentication: {
      type: AuthenticationType.BASIC,
      username: params.username,
      password: params.password,
    },
    headers: {
      'Content-Type': 'application/json',
    },
    body: params.body,
    queryParams: params.query,
  });
}

function buildContactLabel(contact: {
  contact_id: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}): string {
  const name = `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim();
  const detail = contact.email || contact.phone_number;
  if (name && detail) {
    return `${name} (${detail})`;
  }
  return name || detail || `Contact ${contact.contact_id}`;
}
