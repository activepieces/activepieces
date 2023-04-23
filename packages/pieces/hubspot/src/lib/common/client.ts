import { HttpRequest, HttpMethod, AuthenticationType, httpClient } from '@activepieces/pieces-common';
import { Contact, HubSpotAddContactsToListRequest, HubSpotAddContactsToListResponse, HubSpotContactsCreateOrUpdateResponse, HubSpotListsResponse, HubSpotRequest } from './models';

const API = 'https://api.hubapi.com';

export const hubSpotClient = {
  contacts: {
    async createOrUpdate({ token, email, contact }: ContactsCreateOrUpdateParams): Promise<HubSpotContactsCreateOrUpdateResponse> {
      const properties = Object.entries(contact).map(([property, value]) => ({
        property,
        value,
      }));

      const request: HttpRequest<HubSpotRequest> = {
        method: HttpMethod.POST,
        url: `${API}/contacts/v1/contact/createOrUpdate/email/${email}`,
        body: {
          properties,
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token,
        },
      };

      const response = await httpClient.sendRequest<HubSpotContactsCreateOrUpdateResponse>(request);
      return response.body;
    },
  },

  lists: {
    async getStaticLists({ token }: GetStaticListsParams): Promise<HubSpotListsResponse> {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${API}/contacts/v1/lists/static`,
        queryParams: {
          count: '250',
          offset: '0',
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token,
        },
      };

      const response = await httpClient.sendRequest<HubSpotListsResponse>(request);
      return response.body;
    },

    async addContact({ token, listId, email }: ListsAddContactParams): Promise<HubSpotAddContactsToListResponse> {
      const request: HttpRequest<HubSpotAddContactsToListRequest> = {
        method: HttpMethod.POST,
        url: `${API}/contacts/v1/lists/${listId}/add`,
        body: {
          emails: [email],
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token,
        },
      };

      const response = await httpClient.sendRequest<HubSpotAddContactsToListResponse>(request);
      return response.body;
    }
  },
};

type ContactsCreateOrUpdateParams = {
  token: string;
  email: string;
  contact: Partial<Contact>;
};

type GetStaticListsParams = {
  token: string;
}

type ListsAddContactParams = {
  token: string;
  listId: number;
  email: string;
}
