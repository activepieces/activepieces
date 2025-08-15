import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';

export interface Contact {
  id: string;
  displayName: string;
  givenName?: string;
  surname?: string;
  emailAddresses?: Array<{
    address: string;
    name?: string;
  }>;
  phoneNumbers?: Array<{
    number: string;
    type?: string;
  }>;
  businessAddress?: {
    street?: string;
    city?: string;
    state?: string;
    countryOrRegion?: string;
    postalCode?: string;
  };
  homeAddress?: {
    street?: string;
    city?: string;
    state?: string;
    countryOrRegion?: string;
    postalCode?: string;
  };
  companyName?: string;
  jobTitle?: string;
  birthday?: string;
  createdDateTime?: string;
  lastModifiedDateTime?: string;
}

export interface ContactFolder {
  id: string;
  displayName: string;
  parentFolderId?: string;
  childFolderCount?: number;
}

export const microsoft365PeopleCommon = {
  baseUrl: 'https://graph.microsoft.com/v1.0/me',

  createClient(auth: OAuth2PropertyValue): Client {
    return Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(auth.access_token),
      },
    });
  },

  async getContacts(
    auth: OAuth2PropertyValue,
    options?: {
      folderId?: string;
      search?: string;
      orderBy?: string;
      top?: number;
    }
  ): Promise<Contact[]> {
    const client = this.createClient(auth);
    const contacts: Contact[] = [];

    let endpoint = options?.folderId
      ? `/contactFolders/${options.folderId}/contacts`
      : '/contacts';

    const queryParams: string[] = [];

    if (options?.search) {
      queryParams.push(`$search="${options.search}"`);
    }

    if (options?.orderBy) {
      queryParams.push(`$orderby=${options.orderBy}`);
    }

    if (options?.top) {
      queryParams.push(`$top=${options.top}`);
    }

    if (queryParams.length > 0) {
      endpoint += `?${queryParams.join('&')}`;
    }

    try {
      let response = await client.api(endpoint).get();

      while (response.value && response.value.length > 0) {
        contacts.push(...response.value);

        if (response['@odata.nextLink']) {
          response = await client.api(response['@odata.nextLink']).get();
        } else {
          break;
        }
      }

      return contacts;
    } catch (error) {
      throw new Error(`Failed to get contacts: ${error}`);
    }
  },

  async getContactFolders(auth: OAuth2PropertyValue): Promise<ContactFolder[]> {
    const client = this.createClient(auth);
    const folders: ContactFolder[] = [];

    try {
      let response = await client.api('/contactFolders').get();

      while (response.value && response.value.length > 0) {
        folders.push(...response.value);

        if (response['@odata.nextLink']) {
          response = await client.api(response['@odata.nextLink']).get();
        } else {
          break;
        }
      }

      return folders;
    } catch (error) {
      throw new Error(`Failed to get contact folders: ${error}`);
    }
  },

  async createContact(
    auth: OAuth2PropertyValue,
    contactData: Partial<Contact>,
    folderId?: string
  ): Promise<Contact> {
    const client = this.createClient(auth);

    const endpoint = folderId
      ? `/contactFolders/${folderId}/contacts`
      : '/contacts';

    try {
      const response = await client.api(endpoint).post(contactData);
      return response;
    } catch (error) {
      throw new Error(`Failed to create contact: ${error}`);
    }
  },

  async updateContact(
    auth: OAuth2PropertyValue,
    contactId: string,
    contactData: Partial<Contact>
  ): Promise<Contact> {
    const client = this.createClient(auth);

    try {
      const response = await client
        .api(`/contacts/${contactId}`)
        .patch(contactData);
      return response;
    } catch (error) {
      throw new Error(`Failed to update contact: ${error}`);
    }
  },

  async deleteContact(
    auth: OAuth2PropertyValue,
    contactId: string
  ): Promise<void> {
    const client = this.createClient(auth);

    try {
      await client.api(`/contacts/${contactId}`).delete();
    } catch (error) {
      throw new Error(`Failed to delete contact: ${error}`);
    }
  },

  async getContact(
    auth: OAuth2PropertyValue,
    contactId: string
  ): Promise<Contact> {
    const client = this.createClient(auth);

    try {
      const response = await client.api(`/contacts/${contactId}`).get();
      return response;
    } catch (error) {
      throw new Error(`Failed to get contact: ${error}`);
    }
  },

  async createContactFolder(
    auth: OAuth2PropertyValue,
    folderData: Partial<ContactFolder>
  ): Promise<ContactFolder> {
    const client = this.createClient(auth);

    try {
      const response = await client.api('/contactFolders').post(folderData);
      return response;
    } catch (error) {
      throw new Error(`Failed to create contact folder: ${error}`);
    }
  },

  async getContactFolder(
    auth: OAuth2PropertyValue,
    folderId: string
  ): Promise<ContactFolder> {
    const client = this.createClient(auth);

    try {
      const response = await client.api(`/contactFolders/${folderId}`).get();
      return response;
    } catch (error) {
      throw new Error(`Failed to get contact folder: ${error}`);
    }
  },

  async deleteContactFolder(
    auth: OAuth2PropertyValue,
    folderId: string
  ): Promise<void> {
    const client = this.createClient(auth);

    try {
      await client.api(`/contactFolders/${folderId}`).delete();
    } catch (error) {
      throw new Error(`Failed to delete contact folder: ${error}`);
    }
  },

  async searchContactsByEmail(
    auth: OAuth2PropertyValue,
    emailAddress: string
  ): Promise<Contact[]> {
    const client = this.createClient(auth);

    try {
      const response = await client
        .api('/contacts')
        .filter(`emailAddresses/any(a:a/address eq '${emailAddress}')`)
        .get();

      return response.value || [];
    } catch (error) {
      throw new Error(`Failed to search contacts by email: ${error}`);
    }
  },

  async makeRequest<T>(
    auth: OAuth2PropertyValue,
    method: HttpMethod,
    endpoint: string,
    body?: any
  ): Promise<T> {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${this.baseUrl}${endpoint}`,
      body,
      headers: {
        'Content-Type': 'application/json',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
    });

    return response.body;
  },
};
