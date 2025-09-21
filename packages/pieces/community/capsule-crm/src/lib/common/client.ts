import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { CreatePartyParams, Party, UpdatePartyParams } from './types';

export const capsuleCrmClient = {
  async createContact(auth: string, params: CreatePartyParams): Promise<Party> {
    const partyData: { [key: string]: unknown } = {
      type: params.type,
    };

    if (params.type === 'person') {
      partyData['firstName'] = params.firstName;
      partyData['lastName'] = params.lastName;
    } else {
      partyData['name'] = params.name;
    }

    if (params.email) {
      partyData['emailAddresses'] = [{ address: params.email }];
    }
    if (params.phone) {
      partyData['phoneNumbers'] = [{ number: params.phone }];
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: 'https://api.capsulecrm.com/api/v2/parties',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
      body: {
        party: partyData,
      },
    };

    const response = await httpClient.sendRequest<Party>(request);
    return response.body;
  },

  async searchContacts(auth: string, searchTerm: string): Promise<Party[]> {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.capsulecrm.com/api/v2/parties/search`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
      queryParams: {
        q: searchTerm,
      },
    };
    const response = await httpClient.sendRequest<{ parties: Party[] }>(
      request
    );
    return response.body.parties;
  },

  async updateContact(
    auth: string,
    partyId: number,
    params: UpdatePartyParams
  ): Promise<Party> {
    const partyData: { [key: string]: unknown } = {};
    if (params.firstName) partyData['firstName'] = params.firstName;
    if (params.lastName) partyData['lastName'] = params.lastName;
    if (params.name) partyData['name'] = params.name;
    if (params.title) partyData['title'] = params.title;
    if (params.about) partyData['about'] = params.about;
    if (params.email) partyData['emailAddresses'] = [{ address: params.email }];
    if (params.phone) partyData['phoneNumbers'] = [{ number: params.phone }];

    const request: HttpRequest = {
      method: HttpMethod.PUT,
      url: `https://api.capsulecrm.com/api/v2/parties/${partyId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
      body: {
        party: partyData,
      },
    };
    const response = await httpClient.sendRequest<Party>(request);
    return response.body;
  },
};
