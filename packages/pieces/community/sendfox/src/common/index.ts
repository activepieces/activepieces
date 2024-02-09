import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';

export async function getLists(accessToken: string) {
  const list_of_lists = [];
  let last_page = 1;
  for (let i = 1; i <= last_page; i++) {
    const response = (
      await callsendfoxApi<{
        current_page: number;
        data: {
          id: number;
          name: string;
        }[];
        last_page: number;
      }>(HttpMethod.GET, `lists?page=${i}`, accessToken, undefined)
    ).body;
    last_page = response.last_page;
    const lists = response.data;
    list_of_lists.push(lists);
  }
  return list_of_lists;
}
export async function getcontacts(accessToken: string) {
  let list_of_contacts = [];
  let last_page = 1;
  for (let i = 1; i <= last_page; i++) {
    const response = (
      await callsendfoxApi<{
        current_page: number;
        data: {
          id: number;
          first_name: string;
          last_name: string;
        }[];
        last_page: number;
      }>(HttpMethod.GET, `contacts?page=${i}`, accessToken, undefined)
    ).body;
    last_page = response.last_page;
    const contacts = response.data;
    list_of_contacts.push(contacts);
  }

  // convert the list of contacts to have name as first_name+last_name
  list_of_contacts = list_of_contacts.flat().map((contact) => {
    return {
      id: contact.id,
      name: contact.first_name + ' ' + contact.last_name,
    };
  });
  return list_of_contacts;
}

export const sendfoxCommon = {
  lists: Property.Dropdown({
    displayName: 'Lists',
    required: false,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      const authentication = auth as string;
      if (!authentication) {
        return {
          disabled: true,
          placeholder: 'connect your account first',
          options: [],
        };
      }
      const accessToken = authentication;
      const list_of_lists = await getLists(accessToken);
      return {
        disabled: false,
        options: list_of_lists.flat().map((list) => {
          return {
            label: list.name,
            value: list.id,
          };
        }),
      };
    },
  }),
};

export async function callsendfoxApi<T extends HttpMessageBody>(
  method: HttpMethod,
  apiUrl: string,
  accessToken: string,
  body: any | undefined
): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method: method,
    url: `https://api.sendfox.com/${apiUrl}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
    body: body,
  });
}
