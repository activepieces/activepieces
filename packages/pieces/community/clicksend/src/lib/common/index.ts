import {
  Property,
  PiecePropValueSchema,
  DropdownOption,
} from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpMessageBody,
  httpClient,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { clicksendAuth } from '../..';

export const clicksendCommon = {
  phone_number: Property.ShortText({
    description: 'The phone number (with country code, e.g., +1234567890)',
    displayName: 'Phone Number',
    required: true,
  }),

  email: Property.ShortText({
    description: 'The email address',
    displayName: 'Email Address',
    required: true,
  }),

  contact_list_id: Property.Dropdown({
    displayName: 'Contact List ID',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first.',
        };
      }

      const authValue = auth as PiecePropValueSchema<typeof clicksendAuth>;

      const options: DropdownOption<number>[] = [];

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
      return {
        disabled: false,
        options,
      };
    },
  }),

  contact_id: Property.Dropdown({
    displayName: 'Contact ID',
    required: true,
    refreshers: ['contact_list_id'],
    options: async ({ auth, contact_list_id }) => {
      if (!auth || !contact_list_id) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first.',
        };
      }

      const authValue = auth as PiecePropValueSchema<typeof clicksendAuth>;

      const options: DropdownOption<number>[] = [];

      let currentPage = 1;
      let hasNext = true;

      do {
        const response = await callClickSendApi<{
          data: {
            next_page_url?: string;
            data: { contact_id: number; email: string }[];
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
          options.push({ label: contact.email, value: contact.contact_id });
        }

        currentPage++;
        hasNext = !!response.body.data?.next_page_url;
      } while (hasNext);

      return {
        disabled: false,
        options,
      };
    },
  }),
  sender_id: Property.Dropdown({
    displayName: 'From',
    refreshers: [],
    required: true,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first.',
        };
      }
      const authValue = auth as PiecePropValueSchema<typeof clicksendAuth>;

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
) {
  return await httpClient.sendRequest<T>({
    method: params.method,
    url: `https://rest.clicksend.com/v3${params.path}`,
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
