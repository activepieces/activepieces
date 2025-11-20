import {
  HttpMessageBody,
  HttpMethod,
  QueryParams,
  httpClient,
  HttpRequest,
} from '@activepieces/pieces-common';
import {
  KlaviyoProfile,
  KlaviyoList,
  KlaviyoTag,
  CreateProfileRequest,
  UpdateProfileRequest,
  CreateListRequest,
  KlaviyoApiResponse,
  KlaviyoApiListResponse,
} from './types';

export class KlaviyoClient {
  private readonly baseUrl = 'https://a.klaviyo.com/api';
  private readonly apiRevision = '2024-10-15';

  constructor(private apiKey: string) {}

  async makeRequest<T extends HttpMessageBody>(
    method: HttpMethod,
    resourceUri: string,
    query?: QueryParams,
    body: any | undefined = undefined
  ): Promise<T> {
    const request: HttpRequest = {
      method: method,
      url: `${this.baseUrl}${resourceUri}`,
      headers: {
        'Authorization': `Klaviyo-API-Key ${this.apiKey}`,
        'revision': this.apiRevision,
        'Content-Type': 'application/json',
      },
      queryParams: query,
      body: body,
    };
    const res = await httpClient.sendRequest<T>(request);
    return res.body;
  }

  // Authentication validation
  async authenticate() {
    return await this.makeRequest<KlaviyoApiListResponse<KlaviyoProfile>>(
      HttpMethod.GET,
      '/profiles',
      { 'page[size]': '1' }
    );
  }

  // Profile operations
  async createProfile(request: CreateProfileRequest) {
    return await this.makeRequest<KlaviyoApiResponse<KlaviyoProfile>>(
      HttpMethod.POST,
      '/profiles',
      undefined,
      {
        data: {
          type: 'profile',
          attributes: request,
        },
      }
    );
  }

  async updateProfile(profileId: string, request: UpdateProfileRequest) {
    return await this.makeRequest<KlaviyoApiResponse<KlaviyoProfile>>(
      HttpMethod.PATCH,
      `/profiles/${profileId}`,
      undefined,
      {
        data: {
          type: 'profile',
          id: profileId,
          attributes: request,
        },
      }
    );
  }

  async getProfile(profileId: string) {
    return await this.makeRequest<KlaviyoApiResponse<KlaviyoProfile>>(
      HttpMethod.GET,
      `/profiles/${profileId}`
    );
  }

  async searchProfileByEmail(email: string) {
    return await this.makeRequest<KlaviyoApiListResponse<KlaviyoProfile>>(
      HttpMethod.GET,
      '/profiles',
      {
        'filter': `equals(email,"${email}")`,
      }
    );
  }

  async searchProfileByPhone(phone: string) {
    return await this.makeRequest<KlaviyoApiListResponse<KlaviyoProfile>>(
      HttpMethod.GET,
      '/profiles',
      {
        'filter': `equals(phone_number,"${phone}")`,
      }
    );
  }

  async listProfiles(pageSize: number = 20) {
    return await this.makeRequest<KlaviyoApiListResponse<KlaviyoProfile>>(
      HttpMethod.GET,
      '/profiles',
      {
        'page[size]': pageSize.toString(),
      }
    );
  }

  // List operations
  async createList(request: CreateListRequest) {
    return await this.makeRequest<KlaviyoApiResponse<KlaviyoList>>(
      HttpMethod.POST,
      '/lists',
      undefined,
      {
        data: {
          type: 'list',
          attributes: request,
        },
      }
    );
  }

  async getLists() {
    return await this.makeRequest<KlaviyoApiListResponse<KlaviyoList>>(
      HttpMethod.GET,
      '/lists'
    );
  }

  async searchListByName(name: string) {
    return await this.makeRequest<KlaviyoApiListResponse<KlaviyoList>>(
      HttpMethod.GET,
      '/lists',
      {
        'filter': `equals(name,"${name}")`,
      }
    );
  }

  async addProfileToList(listId: string, profileIds: string[]) {
    return await this.makeRequest(
      HttpMethod.POST,
      `/lists/${listId}/relationships/profiles`,
      undefined,
      {
        data: profileIds.map((id) => ({
          type: 'profile',
          id: id,
        })),
      }
    );
  }

  async removeProfileFromList(listId: string, profileIds: string[]) {
    return await this.makeRequest(
      HttpMethod.DELETE,
      `/lists/${listId}/relationships/profiles`,
      undefined,
      {
        data: profileIds.map((id) => ({
          type: 'profile',
          id: id,
        })),
      }
    );
  }

  // Subscription operations
  async subscribeProfiles(listId: string, profiles: Array<{ email?: string; phone_number?: string }>, channel: 'email' | 'sms' = 'email') {
    const profileData = profiles.map((profile) => ({
      type: 'profile',
      attributes: {
        email: profile.email,
        phone_number: profile.phone_number,
        subscriptions: {
          [channel]: {
            marketing: {
              consent: 'SUBSCRIBED' as const,
            },
          },
        },
      },
    }));

    return await this.makeRequest(
      HttpMethod.POST,
      '/profile-subscription-bulk-create-jobs',
      undefined,
      {
        data: {
          type: 'profile-subscription-bulk-create-job',
          attributes: {
            profiles: {
              data: profileData,
            },
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
  }

  async unsubscribeProfiles(listId: string, profiles: Array<{ email?: string; phone_number?: string }>, channel: 'email' | 'sms' = 'email') {
    const profileData = profiles.map((profile) => ({
      type: 'profile',
      attributes: {
        email: profile.email,
        phone_number: profile.phone_number,
        subscriptions: {
          [channel]: {
            marketing: {
              consent: 'UNSUBSCRIBED' as const,
            },
          },
        },
      },
    }));

    return await this.makeRequest(
      HttpMethod.POST,
      '/profile-subscription-bulk-create-jobs',
      undefined,
      {
        data: {
          type: 'profile-subscription-bulk-create-job',
          attributes: {
            profiles: {
              data: profileData,
            },
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
  }

  // Tag operations
  async getTags() {
    return await this.makeRequest<KlaviyoApiListResponse<KlaviyoTag>>(
      HttpMethod.GET,
      '/tags'
    );
  }

  async searchTagByName(name: string) {
    return await this.makeRequest<KlaviyoApiListResponse<KlaviyoTag>>(
      HttpMethod.GET,
      '/tags',
      {
        'filter': `equals(name,"${name}")`,
      }
    );
  }

  async getListProfiles(listId: string) {
    return await this.makeRequest<KlaviyoApiListResponse<KlaviyoProfile>>(
      HttpMethod.GET,
      `/lists/${listId}/profiles`
    );
  }

  async getSegmentProfiles(segmentId: string) {
    return await this.makeRequest<KlaviyoApiListResponse<KlaviyoProfile>>(
      HttpMethod.GET,
      `/segments/${segmentId}/profiles`
    );
  }
}

