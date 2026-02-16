import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import {
  KlaviyoApiResponse,
  KlaviyoApiListResponse,
  KlaviyoProfile,
  KlaviyoList,
  KlaviyoTag,
  KlaviyoBulkJobResponse,
} from './types';

const KLAVIYO_API_BASE = 'https://a.klaviyo.com/api';
const KLAVIYO_API_REVISION = '2025-01-15';

export const klaviyoClient = {
  async makeRequest<T>(
    apiKey: string,
    method: HttpMethod,
    path: string,
    body?: unknown
  ): Promise<T> {
    const request: HttpRequest = {
      method,
      url: `${KLAVIYO_API_BASE}${path}`,
      headers: {
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
        'revision': KLAVIYO_API_REVISION,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
      },
    };

    if (body) {
      request.body = body;
    }

    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  },

  async createProfile(
    apiKey: string,
    email?: string,
    phone?: string,
    properties?: Record<string, unknown>
  ): Promise<KlaviyoApiResponse<KlaviyoProfile>> {
    const attributes: Record<string, unknown> = {};
    
    if (email) attributes.email = email;
    if (phone) attributes.phone_number = phone;
    if (properties) {
      Object.assign(attributes, properties);
    }

    return this.makeRequest<KlaviyoApiResponse<KlaviyoProfile>>(
      apiKey,
      HttpMethod.POST,
      '/profiles',
      {
        data: {
          type: 'profile',
          attributes,
        },
      }
    );
  },

  async updateProfile(
    apiKey: string,
    profileId: string,
    properties: Record<string, unknown>
  ): Promise<KlaviyoApiResponse<KlaviyoProfile>> {
    return this.makeRequest<KlaviyoApiResponse<KlaviyoProfile>>(
      apiKey,
      HttpMethod.PATCH,
      `/profiles/${profileId}`,
      {
        data: {
          type: 'profile',
          id: profileId,
          attributes: properties,
        },
      }
    );
  },

  async getProfiles(
    apiKey: string,
    pageCursor?: string,
    sort?: string
  ): Promise<KlaviyoApiListResponse<KlaviyoProfile>> {
    let path = '/profiles';
    const params: string[] = [];
    
    if (pageCursor) params.push(`page[cursor]=${encodeURIComponent(pageCursor)}`);
    if (sort) params.push(`sort=${sort}`);
    
    if (params.length > 0) {
      path += `?${params.join('&')}`;
    }

    return this.makeRequest<KlaviyoApiListResponse<KlaviyoProfile>>(
      apiKey,
      HttpMethod.GET,
      path
    );
  },

  async findProfileByEmail(
    apiKey: string,
    email: string
  ): Promise<KlaviyoApiListResponse<KlaviyoProfile>> {
    return this.makeRequest<KlaviyoApiListResponse<KlaviyoProfile>>(
      apiKey,
      HttpMethod.GET,
      `/profiles?filter=equals(email,"${email}")`
    );
  },

  async findProfileByPhone(
    apiKey: string,
    phone: string
  ): Promise<KlaviyoApiListResponse<KlaviyoProfile>> {
    return this.makeRequest<KlaviyoApiListResponse<KlaviyoProfile>>(
      apiKey,
      HttpMethod.GET,
      `/profiles?filter=equals(phone_number,"${phone}")`
    );
  },

  async subscribeProfiles(
    apiKey: string,
    listId: string,
    profiles: Array<{ email?: string; phone_number?: string }>
  ): Promise<KlaviyoBulkJobResponse> {
    return this.makeRequest<KlaviyoBulkJobResponse>(
      apiKey,
      HttpMethod.POST,
      '/profile-subscription-bulk-create-jobs',
      {
        data: {
          type: 'profile-subscription-bulk-create-job',
          attributes: {
            custom_source: 'Activepieces',
            profiles: profiles,
          },
          relationships: {
            list: {
              data: {
                type: 'list',
                id: listId,
              },
            },
          },
        },
      }
    );
  },

  async unsubscribeProfiles(
    apiKey: string,
    listId: string,
    profiles: Array<{ email?: string; phone_number?: string }>
  ): Promise<KlaviyoBulkJobResponse> {
    return this.makeRequest<KlaviyoBulkJobResponse>(
      apiKey,
      HttpMethod.POST,
      '/profile-subscription-bulk-delete-jobs',
      {
        data: {
          type: 'profile-subscription-bulk-delete-job',
          attributes: {
            profiles: profiles,
          },
          relationships: {
            list: {
              data: {
                type: 'list',
                id: listId,
              },
            },
          },
        },
      }
    );
  },

  async addProfilesToList(
    apiKey: string,
    listId: string,
    profileIds: string[]
  ): Promise<void> {
    await this.makeRequest(
      apiKey,
      HttpMethod.POST,
      `/lists/${listId}/relationships/profiles`,
      {
        data: profileIds.map(id => ({
          type: 'profile',
          id,
        })),
      }
    );
  },

  async removeProfilesFromList(
    apiKey: string,
    listId: string,
    profileIds: string[]
  ): Promise<void> {
    await this.makeRequest(
      apiKey,
      HttpMethod.DELETE,
      `/lists/${listId}/relationships/profiles`,
      {
        data: profileIds.map(id => ({
          type: 'profile',
          id,
        })),
      }
    );
  },

  async createList(
    apiKey: string,
    name: string,
    optInProcess?: string
  ): Promise<KlaviyoApiResponse<KlaviyoList>> {
    const attributes: Record<string, unknown> = { name };
    if (optInProcess) attributes.opt_in_process = optInProcess;

    return this.makeRequest<KlaviyoApiResponse<KlaviyoList>>(
      apiKey,
      HttpMethod.POST,
      '/lists',
      {
        data: {
          type: 'list',
          attributes,
        },
      }
    );
  },

  async getLists(
    apiKey: string,
    filter?: string
  ): Promise<KlaviyoApiListResponse<KlaviyoList>> {
    let path = '/lists';
    if (filter) {
      path += `?filter=${encodeURIComponent(filter)}`;
    }
    return this.makeRequest<KlaviyoApiListResponse<KlaviyoList>>(
      apiKey,
      HttpMethod.GET,
      path
    );
  },

  async findListByName(
    apiKey: string,
    name: string
  ): Promise<KlaviyoApiListResponse<KlaviyoList>> {
    return this.getLists(apiKey, `equals(name,"${name}")`);
  },

  async getTags(
    apiKey: string,
    filter?: string
  ): Promise<KlaviyoApiListResponse<KlaviyoTag>> {
    let path = '/tags';
    if (filter) {
      path += `?filter=${encodeURIComponent(filter)}`;
    }
    return this.makeRequest<KlaviyoApiListResponse<KlaviyoTag>>(
      apiKey,
      HttpMethod.GET,
      path
    );
  },

  async findTagByName(
    apiKey: string,
    name: string
  ): Promise<KlaviyoApiListResponse<KlaviyoTag>> {
    return this.getTags(apiKey, `equals(name,"${name}")`);
  },

  async getListProfiles(
    apiKey: string,
    listId: string,
    pageCursor?: string
  ): Promise<KlaviyoApiListResponse<KlaviyoProfile>> {
    let path = `/lists/${listId}/profiles`;
    if (pageCursor) {
      path += `?page[cursor]=${encodeURIComponent(pageCursor)}`;
    }
    return this.makeRequest<KlaviyoApiListResponse<KlaviyoProfile>>(
      apiKey,
      HttpMethod.GET,
      path
    );
  },
};
